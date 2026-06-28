document.addEventListener('DOMContentLoaded', () => {
    const game = new Shogi();
    const ui = new UI(game);
    const network = new Network();
    let ai = null;

    // Screen Management
    const screens = {
        start: document.getElementById('start-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        matching: document.getElementById('matching-screen'),
        game: document.getElementById('game-screen')
    };

    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // Event Listeners
    let isOnline = false;
    let myPlayerId = 0; // 0: Sente, 1: Gote
    let isProcessing = false; // Guard for async move processing
    let lastSentMoveIndex = -1; // To prevent echo loops

    // Event Listeners
    document.getElementById('btn-com').addEventListener('click', () => {
        isOnline = false;
        ai = null; // Reset
        showScreen('difficulty');
    });

    document.getElementById('btn-online').addEventListener('click', () => {
        isOnline = true;
        ai = null;
        showScreen('matching');
        document.getElementById('matching-status').textContent = '接続中...';

        network.connect(
            // onGameStart
            (playerIndex) => {
                console.log(`Online game start. I am Player ${playerIndex}`);
                myPlayerId = playerIndex;
                game.init();
                game.turn = SENTE;

                isProcessing = false;
                lastSentMoveIndex = -1;

                // Sync UI perspective (No longer rotating board with CSS)
                ui.localPlayer = playerIndex;
                const board = document.getElementById('shogi-board');
                board.style.transform = 'none';

                showScreen('game');
                ui.render();
                // Show role announcement
                ui.showRoleDialog(playerIndex, null);
            },
            // onMoveReceived
            async (data) => {
                console.log('--- Network move received ---', data);
                if (isProcessing) {
                    console.warn('Ignore move: already processing');
                    return;
                }
                isProcessing = true;

                try {
                    console.log('Opponent moved', data);
                    const opponentRole = myPlayerId === SENTE ? GOTE : SENTE;

                    // Force turn if out of sync
                    if (game.turn !== opponentRole) {
                        console.warn(`Turn sync issue: expected ${opponentRole} but got ${game.turn}`);
                        game.turn = opponentRole;
                    }

                    let success = false;
                    if (data.type === 'move') {
                        success = game.move(data.from.x, data.from.y, data.to.x, data.to.y, data.promote);
                    } else if (data.type === 'drop') {
                        success = game.drop(data.to.x, data.to.y, data.piece);
                    }

                    if (success) {
                        console.log('Move successful, starting UI update...');
                        await ui.onMoveMade();
                        console.log('UI update complete.');
                    } else {
                        console.error('CRITICAL: Received move was REJECTED by local logic!');
                        ui.render();
                    }
                } finally {
                    isProcessing = false;
                }
            },
            // onDisconnect
            () => {
                alert('対戦相手が切断しました');
                showScreen('start');
            }
        );
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.target.dataset.level;
            game.init();
            ai = new AI(game, level);
            myPlayerId = SENTE; // Player is always Sente vs COM
            ui.localPlayer = SENTE;
            isProcessing = false;
            lastSentMoveIndex = -1;
            document.getElementById('shogi-board').style.transform = 'none';
            showScreen('game');
            ui.render();
            // Show role announcement
            ui.showRoleDialog(SENTE, null);
        });
    });

    // Handle turns
    document.addEventListener('game-move', async () => {
        ui.render();

        // Online: Send move if it was my turn
        if (isOnline) {
            const lastMoveIdx = game.history.length - 1;
            const lastMove = game.history[lastMoveIdx];
            if (!lastMove || lastMoveIdx <= lastSentMoveIndex) return;

            // If it is now the OPPONENT'S turn, I must have just successfully moved.
            if (game.turn !== myPlayerId) {
                console.log('Sending move to network:', lastMove);
                lastSentMoveIndex = lastMoveIdx;
                if (lastMove.type === 'move') {
                    network.sendMove({
                        player: myPlayerId,
                        from: lastMove.from,
                        to: lastMove.to,
                        promote: lastMove.promote
                    });
                } else if (lastMove.type === 'drop') {
                    network.sendDrop({
                        player: myPlayerId,
                        to: lastMove.to,
                        piece: lastMove.piece
                    });
                }
            }
        }

        // COM: If it's now GOTE and we act as AI
        if (!isOnline && !game.isGameOver && game.turn === GOTE && ai) {
            // Check if COM has any legal moves (checkmate detection)
            const comMoves = game.getLegalMoves(GOTE);
            if (comMoves.length === 0) {
                // COM is in checkmate - surrender
                game.isGameOver = true;
                game.winner = SENTE;
                ui.render();
                // Show surrender dialog
                setTimeout(() => {
                    ui.showSurrenderDialog();
                }, 300);
                return;
            }

            await ai.makeMove();
            // Centralized sound/narration/render logic
            await ui.onMoveMade();

            // After COM moves, check if player is in checkmate
            if (!game.isGameOver) {
                const playerMoves = game.getLegalMoves(SENTE);
                if (playerMoves.length === 0) {
                    game.isGameOver = true;
                    game.winner = GOTE;
                    ui.render();
                }
            }
        }
    });

    document.getElementById('btn-back-diff').addEventListener('click', () => {
        showScreen('start');
    });

    document.getElementById('btn-cancel-matching').addEventListener('click', () => {
        // TODO: Proper disconnect
        showScreen('start');
    });

    document.getElementById('btn-resign').addEventListener('click', () => {
        if (confirm('投了しますか？')) {
            alert('負けました...');
            showScreen('start');
        }
    });

    // Validating basic render
    ui.render();
});
