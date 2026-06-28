document.addEventListener('DOMContentLoaded', () => {
    const game = new Shogi();
    const ui = new UI(game);
    const network = new Network();
    let ai = null;

    // Screen Management
    const screens = {
        start: document.getElementById('start-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        side: document.getElementById('side-screen'),
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
    let aiPlayerId = GOTE;
    let selectedComLevel = 'easy';
    let isProcessing = false; // Guard for async move processing
    let lastSentMoveIndex = -1; // To prevent echo loops

    function startComputerGame(level, playerSide) {
        isOnline = false;
        game.init();
        ui.resetTransientEffects();
        ai = new AI(game, level);
        myPlayerId = playerSide;
        aiPlayerId = playerSide === SENTE ? GOTE : SENTE;
        ui.localPlayer = playerSide;
        isProcessing = false;
        lastSentMoveIndex = -1;
        document.getElementById('shogi-board').style.transform = 'none';
        showScreen('game');
        ui.render();
        ui.showRoleDialog(playerSide, () => {
            if (!game.isGameOver && game.turn === aiPlayerId) {
                document.dispatchEvent(new CustomEvent('game-move'));
            }
        });
    }

    function winnerOf(player) {
        return player === SENTE ? GOTE : SENTE;
    }

    // Event Listeners
    document.getElementById('btn-com').addEventListener('click', () => {
        isOnline = false;
        ai = null; // Reset
        ui.resetTransientEffects();
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
                ui.resetTransientEffects();
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
            selectedComLevel = e.target.dataset.level;
            showScreen('side');
        });
    });

    document.querySelectorAll('.side-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const side = e.target.dataset.side;
            const playerSide = side === 'random'
                ? (Math.random() < 0.5 ? SENTE : GOTE)
                : (side === 'gote' ? GOTE : SENTE);
            startComputerGame(selectedComLevel, playerSide);
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

        if (!isOnline && !game.isGameOver && game.turn === aiPlayerId && ai) {
            if (isProcessing) return;
            isProcessing = true;

            try {
                const aiMoves = game.getLegalMoves(aiPlayerId);
                if (aiMoves.length === 0) {
                    game.isGameOver = true;
                    game.winner = myPlayerId;
                    ui.render();
                    setTimeout(() => {
                        ui.showSurrenderDialog();
                    }, 300);
                    return;
                }

                await ai.makeMove();
                await ui.onMoveMade();

                if (!game.isGameOver) {
                    const playerMoves = game.getLegalMoves(myPlayerId);
                    if (playerMoves.length === 0) {
                        game.isGameOver = true;
                        game.winner = aiPlayerId;
                        ui.render();
                    }
                }
            } finally {
                isProcessing = false;
            }
        }
    });

    document.getElementById('btn-back-diff').addEventListener('click', () => {
        showScreen('start');
    });

    document.getElementById('btn-back-side').addEventListener('click', () => {
        showScreen('difficulty');
    });

    document.getElementById('btn-cancel-matching').addEventListener('click', () => {
        // TODO: Proper disconnect
        showScreen('start');
    });

    document.getElementById('btn-resign').addEventListener('click', () => {
        if (confirm('投了しますか？')) {
            game.isGameOver = true;
            game.winner = winnerOf(myPlayerId);
            ai = null;
            ui.resetTransientEffects();
            game.init();
            ui.render();
            showScreen('start');
        }
    });

    // Validating basic render
    ui.render();
});
