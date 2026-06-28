const WIKI_CASTLE_PATTERNS = [
    {
        id: 'ahiru',
        name: 'アヒル囲い',
        message: 'アヒル囲い！',
        voice: 'audio/ahiru.mp3',
        source: 'Wikipedia: アヒル囲い',
        squares: [['58', 'K'], ['68', 'S'], ['48', 'S'], ['79', 'G'], ['39', 'G'], ['26', 'R'], ['97', 'B']],
        highlightSquares: ['58', '68', '48', '79', '39', '26', '97']
    },
    {
        id: 'mino',
        name: '美濃囲い',
        message: '美濃囲い！',
        voice: 'audio/mino.mp3',
        source: 'Wikipedia: 美濃囲い',
        squares: [['28', 'K'], ['38', 'S'], ['58', 'G'], ['49', 'G']],
        highlightSquares: ['28', '38', '58', '49']
    },
    {
        id: 'yagura',
        name: '矢倉囲い',
        message: '矢倉囲い！',
        voice: 'audio/yagura.mp3',
        source: 'Wikipedia: 矢倉囲い',
        squares: [['88', 'K'], ['78', 'G'], ['67', 'G'], ['77', 'S']],
        highlightSquares: ['88', '78', '67', '77']
    },
    {
        id: 'kani',
        name: 'カニ囲い',
        message: 'カニ囲い！',
        voice: 'audio/kani.mp3',
        source: 'Wikipedia: カニ囲い',
        squares: [['69', 'K'], ['78', 'G'], ['68', 'S'], ['58', 'G']],
        highlightSquares: ['69', '78', '68', '58']
    },
    {
        id: 'funa',
        name: '舟囲い',
        message: '舟囲い！',
        voice: 'audio/funa.mp3',
        source: 'Wikipedia: 舟囲い',
        squares: [['88', 'B'], ['78', 'K'], ['79', 'S'], ['69', 'G'], ['58', 'G'], ['48', 'S']],
        highlightSquares: ['88', '78', '79', '69', '58', '48']
    },
    {
        id: 'anaguma_basic',
        name: '穴熊囲い',
        message: '穴熊囲い！',
        voice: 'audio/anaguma.mp3',
        source: 'Wikipedia: 穴熊囲い',
        squares: [['19', 'K'], ['18', 'L'], ['28', 'S'], ['38', 'G'], ['39', 'G'], ['29', 'N']],
        highlightSquares: ['19', '18', '28', '38', '39', '29']
    },
    {
        id: 'ibisha_anaguma',
        name: '居飛車穴熊',
        message: '居飛車穴熊！',
        voice: 'audio/ibisha_anaguma.mp3',
        source: 'Wikipedia: 居飛車穴熊',
        squares: [['99', 'K'], ['98', 'L'], ['88', 'S'], ['79', 'G'], ['78', 'G'], ['89', 'N']],
        highlightSquares: ['99', '98', '88', '79', '78', '89']
    },
    {
        id: 'gangi_old',
        name: '雁木囲い',
        message: '雁木囲い！',
        voice: 'audio/gangi.mp3',
        source: 'Wikipedia: 雁木囲い / 相居飛車二枚銀雁木',
        squares: [['69', 'K'], ['78', 'G'], ['58', 'G'], ['67', 'S'], ['57', 'S']],
        highlightSquares: ['69', '78', '58', '67', '57']
    },
    {
        id: 'tsunogin_gangi',
        name: 'ツノ銀雁木',
        message: 'ツノ銀雁木！',
        voice: 'audio/tsunogin_gangi.mp3',
        source: 'Wikipedia: 雁木囲い / 相居飛車ツノ銀雁木',
        squares: [['69', 'K'], ['78', 'G'], ['58', 'G'], ['67', 'S'], ['47', 'S']],
        highlightSquares: ['69', '78', '58', '67', '47']
    }
];

class UI {
    constructor(game) {
        this.game = game;
        this.boardEl = document.getElementById('shogi-board');
        this.playerHandEl = document.getElementById('player-pieces');
        this.opponentHandEl = document.getElementById('opponent-pieces');
        this.selectedCell = null;
        this.currentLegalMoves = [];
        this.localPlayer = SENTE; // Default
        this.lastCheckKey = null;
        this.pendingCheckAnnouncement = null;
        this.lastFoulKey = null;
        this.castleTriggered = { [SENTE]: new Set(), [GOTE]: new Set() };
        this.activeCastleSquares = new Set();
        this.castleFrameTimer = null;

        this.initBoard();
        this.initResultDialog();
    }

    initBoard() {
        this.boardEl.innerHTML = '';
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', () => this.onCellClick(x, y));
                this.boardEl.appendChild(cell);
            }
        }
    }

    initResultDialog() {
        const btn = document.getElementById('btn-return-title');
        if (btn) {
            btn.addEventListener('click', () => {
                this.game.init();
                this.resetTransientEffects();
                document.getElementById('result-dialog').classList.add('hidden');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                document.getElementById('start-screen').classList.add('active');
                this.render();
            });
        }
    }

    showRoleDialog(role, onClose) {
        const dialog = document.getElementById('role-dialog');
        const title = document.getElementById('role-title');
        const msg = document.getElementById('role-message');
        const btn = document.getElementById('btn-role-ok');

        this.localPlayer = role;

        title.textContent = role === SENTE ? '先手です' : '後手です';
        msg.textContent = role === SENTE
            ? 'あなたは先手（下側）です。先に指します。'
            : 'あなたは後手（下側）です。相手の手番から始まります。';

        dialog.classList.remove('hidden');

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            dialog.classList.add('hidden');
            if (onClose) onClose();
        });
    }

    resetCastleTriggers() {
        this.castleTriggered[SENTE].clear();
        this.castleTriggered[GOTE].clear();
        this.activeCastleSquares.clear();
        if (this.castleFrameTimer) {
            clearTimeout(this.castleFrameTimer);
            this.castleFrameTimer = null;
        }

        const banner = document.getElementById('castle-banner');
        if (banner) {
            banner.classList.remove('show');
            banner.textContent = '';
        }
    }

    resetTransientEffects() {
        this.selectedCell = null;
        this.currentLegalMoves = [];
        this.lastCheckKey = null;
        this.pendingCheckAnnouncement = null;
        this.lastFoulKey = null;
        this.resetCastleTriggers();

        ['check-banner', 'castle-banner'].forEach(id => {
            const banner = document.getElementById(id);
            if (banner) banner.classList.remove('show');
        });

        ['promote-dialog', 'role-dialog', 'result-dialog'].forEach(id => {
            const dialog = document.getElementById(id);
            if (dialog) dialog.classList.add('hidden');
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    coordsToSquare(x, y) {
        return `${9 - x}${y + 1}`;
    }

    squareToCoords(square) {
        const file = Number(square[0]);
        const rank = Number(square[1]);
        return { x: 9 - file, y: rank - 1 };
    }

    flipSquare(square) {
        const file = Number(square[0]);
        const rank = Number(square[1]);
        return `${10 - file}${10 - rank}`;
    }

    normalizeCastleSquare(square, owner) {
        return owner === SENTE ? square : this.flipSquare(square);
    }

    pieceToCastleCode(type) {
        const map = {
            [PIECES.FU]: 'P',
            [PIECES.KY]: 'L',
            [PIECES.KE]: 'N',
            [PIECES.GI]: 'S',
            [PIECES.KI]: 'G',
            [PIECES.KA]: 'B',
            [PIECES.HI]: 'R',
            [PIECES.OU]: 'K'
        };
        return map[type] || null;
    }

    async checkCastlePatternsForBoth() {
        if (this.game.isGameOver) return;
        await this.checkCastlePatterns(SENTE);
        await this.checkCastlePatterns(GOTE);
    }

    async checkCastlePatterns(owner) {
        for (const pattern of WIKI_CASTLE_PATTERNS) {
            if (this.castleTriggered[owner].has(pattern.id)) continue;
            if (!this.isExactCastleMatch(pattern, owner)) continue;

            this.castleTriggered[owner].add(pattern.id);
            await this.triggerCastleEffect(pattern, owner);
        }
    }

    isExactCastleMatch(pattern, owner) {
        return pattern.squares.every(([baseSquare, requiredPiece]) => {
            const square = this.normalizeCastleSquare(baseSquare, owner);
            const { x, y } = this.squareToCoords(square);
            const actual = this.game.board[x]?.[y];

            if (!actual) return false;
            if (actual.player !== owner) return false;
            return this.pieceToCastleCode(actual.type) === requiredPiece;
        });
    }

    async triggerCastleEffect(pattern, owner) {
        const squares = pattern.highlightSquares.map(square => this.normalizeCastleSquare(square, owner));
        this.activeCastleSquares = new Set(squares);

        this.showCastleBanner(pattern.message);
        this.render();

        if (this.castleFrameTimer) clearTimeout(this.castleFrameTimer);
        await Promise.race([
            Promise.all([this.playCastleVoice(pattern), this.delay(900)]),
            this.delay(2800)
        ]);

        this.castleFrameTimer = setTimeout(() => {
            this.activeCastleSquares.clear();
            this.castleFrameTimer = null;
            this.render();
        }, 160);
    }

    showCastleBanner(text) {
        const screen = document.getElementById('game-screen');
        if (!screen) return;

        let banner = document.getElementById('castle-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'castle-banner';
            banner.className = 'castle-banner';
            screen.appendChild(banner);
        }

        banner.textContent = text;
        banner.classList.remove('show');
        void banner.offsetWidth;
        banner.classList.add('show');
    }

    playCastleVoice(pattern) {
        return new Promise(resolve => {
            let resolved = false;
            let fallbackStarted = false;

            const finish = () => {
                if (resolved) return;
                resolved = true;
                resolve();
            };

            const fallback = () => {
                if (fallbackStarted) return;
                fallbackStarted = true;
                this.speakText(pattern.message, { rate: 0.92, pitch: 1.08, timeoutMs: 1800 }).then(finish);
            };

            try {
                const audio = new Audio(pattern.voice);
                audio.volume = 0.9;
                audio.onended = finish;
                audio.onerror = fallback;

                const playPromise = audio.play();
                if (playPromise?.catch) playPromise.catch(fallback);

                setTimeout(finish, 2400);
            } catch {
                fallback();
            }
        });
    }

    render() {
        const cells = this.boardEl.children;

        // Find king positions for check highlight
        let senteKingPos = null, goteKingPos = null;
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = this.game.board[x][y];
                if (p && p.type === PIECES.OU) {
                    if (p.player === SENTE) senteKingPos = { x, y };
                    else goteKingPos = { x, y };
                }
            }
        }

        const senteInCheck = !this.game.isGameOver && this.game.isInCheck(SENTE);
        const goteInCheck = !this.game.isGameOver && this.game.isInCheck(GOTE);
        const checkedPlayers = [];
        if (senteInCheck && senteKingPos) checkedPlayers.push({ player: SENTE, pos: senteKingPos });
        if (goteInCheck && goteKingPos) checkedPlayers.push({ player: GOTE, pos: goteKingPos });

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                // Determine which physical cell index corresponds to this (x,y)
                // Normal (Sente): (0,0) at top-left. Correct.
                // Flip (Gote): (0,0) at bottom-right.
                const visualX = (this.localPlayer === GOTE) ? 8 - x : x;
                const visualY = (this.localPlayer === GOTE) ? 8 - y : y;
                const index = visualY * 9 + visualX;

                const cell = cells[index];
                const piece = this.game.board[x][y];

                cell.innerHTML = '';
                cell.className = 'cell';

                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece';
                    pieceEl.textContent = this.getPieceChar(piece.type);
                    // Local pieces point UP (0deg), Opponent pieces point DOWN (180deg)
                    if (piece.player !== this.localPlayer) pieceEl.classList.add('opponent');
                    if (this.isPromoted(piece.type)) pieceEl.classList.add('promoted');
                    if (piece.type === PIECES.OU && ((piece.player === SENTE && senteInCheck) || (piece.player === GOTE && goteInCheck))) {
                        pieceEl.classList.add('king-in-check');
                    }
                    cell.appendChild(pieceEl);
                }

                // Selection (use internal game x,y)
                if (this.selectedCell && !this.selectedCell.isHand &&
                    this.selectedCell.x === x && this.selectedCell.y === y) {
                    cell.classList.add('selected');
                }

                // Last Move Highlight
                const lastMove = this.game.history.length > 0 ? this.game.history[this.game.history.length - 1] : null;
                if (lastMove) {
                    if (lastMove.to && lastMove.to.x === x && lastMove.to.y === y) cell.classList.add('last-move');
                    if (lastMove.from && lastMove.from.x === x && lastMove.from.y === y) cell.classList.add('last-move');
                    if (lastMove.drop && lastMove.to && lastMove.to.x === x && lastMove.to.y === y) {
                        cell.classList.add(lastMove.violation ? 'foul-drop' : 'drop-impact');
                    }
                }

                // Legal Move Highlight
                if (this.selectedCell) {
                    if (this.selectedCell.isHand) {
                        if (!piece) {
                            const violation = this.game.getDropViolation(x, y, this.selectedCell.type, this.game.turn);
                            cell.classList.add(violation ? 'illegal-drop' : 'highlight');
                        }
                    } else {
                        const isDest = this.currentLegalMoves.some(m => !m.drop && m.to.x === x && m.to.y === y);
                        if (isDest) cell.classList.add('highlight');
                    }
                }

                // Check highlight
                if (senteInCheck && senteKingPos && senteKingPos.x === x && senteKingPos.y === y) {
                    cell.classList.add('in-check');
                }
                if (goteInCheck && goteKingPos && goteKingPos.x === x && goteKingPos.y === y) {
                    cell.classList.add('in-check');
                }

                if (this.game.foul?.existingPawn && this.game.foul.existingPawn.x === x && this.game.foul.existingPawn.y === y) {
                    cell.classList.add('foul-reference');
                }

                if (this.activeCastleSquares.has(this.coordsToSquare(x, y))) {
                    cell.classList.add('castle-frame');
                }
            }
        }

        // Render Hands - Swap based on localPlayer
        if (this.localPlayer === SENTE) {
            this.renderHand(this.playerHandEl, this.game.hands[SENTE], SENTE);
            this.renderHand(this.opponentHandEl, this.game.hands[GOTE], GOTE);
        } else {
            // Local player is Gote, so show Gote hand at bottom (playerHandEl)
            this.renderHand(this.playerHandEl, this.game.hands[GOTE], GOTE);
            this.renderHand(this.opponentHandEl, this.game.hands[SENTE], SENTE);
        }

        // Labels
        const topLabel = document.querySelector('.hand-top .hand-bar-label');
        const bottomLabel = document.querySelector('.hand-bottom .hand-bar-label');
        if (topLabel && bottomLabel) {
            if (this.localPlayer === SENTE) {
                topLabel.textContent = '後手持駒：';
                bottomLabel.textContent = '先手持駒：';
            } else {
                topLabel.textContent = '先手持駒：';
                bottomLabel.textContent = '後手持駒：';
            }
        }

        // Game Status
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            if (this.game.isGameOver) {
                if (this.game.foul) {
                    const loserName = this.game.foul.player === SENTE ? '先手' : '後手';
                    statusEl.textContent = `${loserName}の反則負け`;
                    statusEl.className = 'in-check';
                    this.showFoulDialog(this.game.foul);
                } else {
                    const winnerName = this.game.winner === SENTE ? '先手' : '後手';
                    statusEl.textContent = `${winnerName}の勝ち！`;
                    statusEl.className = '';
                    this.showResultDialog(winnerName);
                }
            } else {
                const turnName = this.game.turn === SENTE ? '先手' : '後手';
                const inCheck = this.game.turn === SENTE ? senteInCheck : goteInCheck;
                statusEl.textContent = inCheck ? `${turnName}の手番（王手！）` : `${turnName}の手番`;
                statusEl.className = inCheck ? 'in-check' : '';
                this.updateCheckEffects(checkedPlayers);
            }
        }
    }

    updateCheckEffects(checkedPlayers) {
        const key = checkedPlayers
            .map(item => `${item.player}:${item.pos.x},${item.pos.y}:${this.game.history.length}`)
            .join('|');

        if (!key) {
            this.lastCheckKey = null;
            return;
        }
        if (key === this.lastCheckKey) return;

        this.lastCheckKey = key;
        this.pendingCheckAnnouncement = checkedPlayers.map(item => item.player);
        this.showCheckBanner();
        this.playSound('check');
    }

    showCheckBanner() {
        const screen = document.getElementById('game-screen');
        if (!screen) return;
        let banner = document.getElementById('check-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'check-banner';
            banner.className = 'check-banner';
            banner.textContent = '王手！';
            screen.appendChild(banner);
        }
        banner.classList.remove('show');
        void banner.offsetWidth;
        banner.classList.add('show');
    }

    showResultDialog(winnerName) {
        const dialog = document.getElementById('result-dialog');
        if (!dialog || !dialog.classList.contains('hidden')) return;
        document.getElementById('result-title').textContent = `${winnerName}の勝ち！`;
        document.getElementById('result-message').textContent = '対局が終了しました。';
        dialog.classList.remove('hidden');
    }

    showSurrenderDialog() {
        const dialog = document.getElementById('result-dialog');
        if (!dialog) return;
        document.getElementById('result-title').textContent = '参りました';
        document.getElementById('result-message').textContent = 'あなたの勝ちです！おめでとうございます！';
        dialog.classList.remove('hidden');
    }

    showFoulDialog(foul) {
        const dialog = document.getElementById('result-dialog');
        if (!dialog) return;

        const key = `${foul.player}:${foul.code}:${foul.square}:${this.game.history.length}`;
        if (!dialog.classList.contains('hidden') && this.lastFoulKey === key) return;
        this.lastFoulKey = key;

        const loserName = foul.player === SENTE ? '先手' : '後手';
        document.getElementById('result-title').textContent = `${loserName}の反則負け`;
        document.getElementById('result-message').textContent = `${foul.reason}\n打った場所：${foul.square}`;
        dialog.classList.remove('hidden');
    }

    renderHand(container, hand, player) {
        container.innerHTML = '';
        const counts = {};
        hand.forEach(type => { counts[type] = (counts[type] || 0) + 1; });

        // Sort: higher value pieces first
        const order = [PIECES.HI, PIECES.KA, PIECES.KI, PIECES.GI, PIECES.KE, PIECES.KY, PIECES.FU];
        const sortedTypes = Object.keys(counts).map(Number).sort((a, b) => {
            const ai = order.indexOf(a), bi = order.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        sortedTypes.forEach(type => {
            const count = counts[type];

            const wrapper = document.createElement('div');
            wrapper.className = 'hand-piece-wrapper';

            const pieceEl = document.createElement('div');
            pieceEl.className = 'piece';
            if (player !== this.localPlayer) pieceEl.classList.add('opponent');
            pieceEl.textContent = this.getPieceChar(type);

            if (count > 1) {
                const badge = document.createElement('span');
                badge.className = 'count-badge';
                badge.textContent = count;
                wrapper.appendChild(badge);
            }

            wrapper.appendChild(pieceEl);

            // Allow interaction if it's this player's turn AND they own the piece
            if (player === this.game.turn && player === this.localPlayer && !this.game.isGameOver) {
                wrapper.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectHandPiece(type, player);
                });
                if (this.selectedCell && this.selectedCell.isHand && this.selectedCell.type === type) {
                    wrapper.classList.add('selected');
                }
            }

            container.appendChild(wrapper);
        });
    }

    getPieceChar(type) {
        const chars = {
            1: '歩', 2: '香', 3: '桂', 4: '銀', 5: '金', 6: '角', 7: '飛', 8: '王',
            11: 'と', 12: '杏', 13: '圭', 14: '全', 16: '馬', 17: '龍'
        };
        return chars[type] || '';
    }

    isPromoted(type) { return type > 10; }

    onCellClick(physX, physY) {
        if (this.game.isGameOver) return;
        // Restrict interaction to local player's turn
        if (this.game.turn !== this.localPlayer) return;

        // Map physical coordinates back to game coordinates
        const x = (this.localPlayer === GOTE) ? 8 - physX : physX;
        const y = (this.localPlayer === GOTE) ? 8 - physY : physY;

        if (this.selectedCell) {
            const from = this.selectedCell;

            // Deselect same cell
            if (!from.isHand && from.x === x && from.y === y) {
                this.selectedCell = null;
                this.currentLegalMoves = [];
                this.render();
                return;
            }

            if (from.isHand) {
                // Drop
                if (this.game.drop(x, y, from.type)) {
                    this.selectedCell = null;
                    this.currentLegalMoves = [];
                    this.onMoveMade();
                } else {
                    this.selectCell(x, y);
                }
            } else {
                // Board move
                const legalMoves = this.currentLegalMoves.filter(m =>
                    !m.drop && m.from.x === from.x && m.from.y === from.y &&
                    m.to.x === x && m.to.y === y
                );

                if (legalMoves.length > 0) {
                    const promoMove = legalMoves.find(m => m.promote === true);
                    const normalMove = legalMoves.find(m => m.promote === false);

                    if (promoMove && normalMove) {
                        this.showPromoteDialog(from.x, from.y, x, y);
                        return; // Don't render yet, dialog handles it
                    } else if (promoMove) {
                        this.game.move(from.x, from.y, x, y, true);
                        this.selectedCell = null;
                        this.currentLegalMoves = [];
                        this.onMoveMade();
                    } else {
                        this.game.move(from.x, from.y, x, y, false);
                        this.selectedCell = null;
                        this.currentLegalMoves = [];
                        this.onMoveMade();
                    }
                } else {
                    // Try selecting another piece
                    this.selectCell(x, y);
                }
            }
        } else {
            this.selectCell(x, y);
        }
        this.render();
    }

    selectCell(x, y) {
        const piece = this.game.board[x][y];
        // Must be turn-player AND matching the piece owner
        if (piece && piece.player === this.game.turn && piece.player === this.localPlayer) {
            this.selectedCell = { x, y, isHand: false };
            this.highlightLegalMoves(x, y);
        } else {
            this.selectedCell = null;
            this.currentLegalMoves = [];
        }
    }

    selectHandPiece(type, player) {
        if (player !== this.game.turn) return;
        if (this.selectedCell && this.selectedCell.isHand && this.selectedCell.type === type) {
            // Deselect
            this.selectedCell = null;
            this.currentLegalMoves = [];
        } else {
            this.selectedCell = { type, isHand: true };
            this.currentLegalMoves = [];
        }
        this.render();
    }

    highlightLegalMoves(fx, fy) {
        const allMoves = this.game.getPlayableMoves(this.game.turn);
        this.currentLegalMoves = allMoves.filter(m =>
            !m.drop && m.from.x === fx && m.from.y === fy
        );
    }

    async onMoveMade() {
        this.render();
        const lastMove = this.game.history[this.game.history.length - 1];
        if (lastMove) {
            if (lastMove.violation) {
                this.playSound('foul');
                await this.announceFoul();
                document.dispatchEvent(new CustomEvent('game-move'));
                return;
            }

            // The player who just moved is the one BEFORE turn switched
            const movedPlayer = this.game.turn === SENTE ? GOTE : SENTE;
            const hadCapture = lastMove.captured != null;
            this.playSound(lastMove.drop ? 'drop' : (hadCapture ? 'capture' : 'move'));
            // Wait a moment for sound, then narrate and await completion
            await new Promise(r => setTimeout(r, 120));
            await this.narrateMove(lastMove, movedPlayer);
            await this.announcePendingCheck();
            await this.checkCastlePatternsForBoth();
        }
        document.dispatchEvent(new CustomEvent('game-move'));
    }

    showPromoteDialog(fx, fy, tx, ty) {
        const dialog = document.getElementById('promote-dialog');
        dialog.classList.remove('hidden');

        const btnYes = document.getElementById('btn-promote-yes');
        const btnNo = document.getElementById('btn-promote-no');
        const newBtnYes = btnYes.cloneNode(true);
        const newBtnNo = btnNo.cloneNode(true);
        btnYes.parentNode.replaceChild(newBtnYes, btnYes);
        btnNo.parentNode.replaceChild(newBtnNo, btnNo);

        const close = (promote) => {
            dialog.classList.add('hidden');
            this.game.move(fx, fy, tx, ty, promote);
            this.selectedCell = null;
            this.currentLegalMoves = [];
            this.onMoveMade();
        };

        newBtnYes.addEventListener('click', () => close(true));
        newBtnNo.addEventListener('click', () => close(false));
    }

    // ===== SOUND =====
    playSound(type) {
        try {
            if (type === 'move' || type === 'capture') {
                const audio = new Audio('assets/spo_ge_syogi_s03.mp3');
                audio.play();
                return;
            }
            if (type === 'drop') {
                const audio = new Audio('assets/spo_ge_syogi_s03.mp3');
                audio.volume = 0.8;
                audio.play();
            }

            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (frequency, duration, gain = 0.12, oscillatorType = 'sine', delay = 0) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);
                oscillator.type = oscillatorType;
                oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
                gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
                oscillator.start(ctx.currentTime + delay);
                oscillator.stop(ctx.currentTime + delay + duration);
            };

            if (type === 'select') {
                // 選択音: 軽いクリック
                playTone(1200, 0.05, 0.1);
            } else if (type === 'drop') {
                playTone(180, 0.09, 0.18, 'triangle');
                playTone(420, 0.06, 0.08, 'square', 0.04);
            } else if (type === 'check') {
                playTone(720, 0.12, 0.16, 'sawtooth');
                playTone(1080, 0.16, 0.12, 'sawtooth', 0.08);
            } else if (type === 'foul') {
                playTone(180, 0.18, 0.16, 'square');
                playTone(110, 0.24, 0.16, 'square', 0.12);
            }
        } catch (e) {
            // Audio not supported
            console.error('Audio error:', e);
        }
    }

    announcePendingCheck() {
        if (!this.pendingCheckAnnouncement || this.pendingCheckAnnouncement.length === 0) {
            return Promise.resolve();
        }
        this.pendingCheckAnnouncement = null;
        return this.speakText('王手！', { rate: 0.95, pitch: 1.18, timeoutMs: 1000 });
    }

    announceFoul() {
        const foul = this.game.foul;
        if (!foul) return Promise.resolve();
        return this.speakText(`反則負け。${foul.reason}`, { rate: 0.95, pitch: 0.85, timeoutMs: 1800 });
    }

    speakText(text, options = {}) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = options.rate ?? 1.0;
            utterance.pitch = options.pitch ?? 1.0;
            utterance.volume = options.volume ?? 1.0;

            const voices = window.speechSynthesis.getVoices();
            const jaVoice = voices.find(v => v.lang.startsWith('ja'));
            if (jaVoice) utterance.voice = jaVoice;

            const timeout = setTimeout(() => {
                console.warn('Speech synthesis timeout');
                resolve();
            }, options.timeoutMs ?? 1500);

            utterance.onend = () => {
                clearTimeout(timeout);
                resolve();
            };
            utterance.onerror = () => {
                clearTimeout(timeout);
                resolve();
            };

            window.speechSynthesis.cancel();
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        });
    }

    // ===== MOVE NARRATION =====
    // Returns a Promise that resolves when speech finishes (or immediately if no speech support)
    narrateMove(move, player) {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) { resolve(); return; }

            // 駒の読み方（正式な将棋の読み）
            const pieceReadings = {
                1: 'ふ',       // 歩
                2: 'きょう',   // 香
                3: 'けい',     // 桂
                4: 'ぎん',     // 銀
                5: 'きん',     // 金
                6: 'かく',     // 角
                7: 'ひ',       // 飛
                8: 'ぎょく',   // 玉将
                11: 'ときん',   // と金
                12: 'なりきょう', // 成香
                13: 'なりけい', // 成桂
                14: 'なりぎん', // 成銀
                16: 'うま',     // 馬（角行成）
                17: 'りゅう'    // 龍（飛車成）
            };

            // 筋: x=0→きゅう, x=8→いち
            const sujiReadings = ['きゅう', 'はち', 'なな', 'ろく', 'ご', 'よん', 'さん', 'に', 'いち'];
            // 段: y=0→いち, y=8→きゅう
            const danReadings = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

            // 先手/後手
            const playerName = (player === SENTE) ? 'せんて' : 'ごて';

            let moveText = '';
            if (move.drop) {
                const suji = sujiReadings[move.to.x];
                const dan = danReadings[move.to.y];
                const piece = pieceReadings[move.type] || '';
                moveText = `${suji}${dan}、${piece}うち`;
            } else {
                const suji = sujiReadings[move.to.x];
                const dan = danReadings[move.to.y];
                // piece type is what ended up on the destination square
                const destPiece = this.game.board[move.to.x]?.[move.to.y];
                const piece = destPiece ? (pieceReadings[destPiece.type] || '') : '';
                moveText = `${suji}${dan}、${piece}`;
                if (move.promote) moveText += '、なり';
            }

            this.speakText(`${playerName}、${moveText}`).then(resolve);
        });
    }
}
