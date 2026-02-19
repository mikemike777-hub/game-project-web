class UI {
    constructor(game) {
        this.game = game;
        this.boardEl = document.getElementById('shogi-board');
        this.playerHandEl = document.getElementById('player-pieces');
        this.opponentHandEl = document.getElementById('opponent-pieces');
        this.selectedCell = null;
        this.currentLegalMoves = [];
        this.localPlayer = SENTE; // Default

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
                document.getElementById('result-dialog').classList.add('hidden');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                document.getElementById('start-screen').classList.add('active');
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
                }

                // Legal Move Highlight
                if (this.selectedCell) {
                    if (this.selectedCell.isHand) {
                        if (!piece && this.game.canDrop(x, y, this.selectedCell.type, this.game.turn)) {
                            cell.classList.add('highlight');
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
                const winnerName = this.game.winner === SENTE ? '先手' : '後手';
                statusEl.textContent = `${winnerName}の勝ち！`;
                statusEl.className = '';
                this.showResultDialog(winnerName);
            } else {
                const turnName = this.game.turn === SENTE ? '先手' : '後手';
                const inCheck = this.game.turn === SENTE ? senteInCheck : goteInCheck;
                statusEl.textContent = inCheck ? `${turnName}の手番（王手！）` : `${turnName}の手番`;
                statusEl.className = inCheck ? 'in-check' : '';
            }
        }
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
        const allMoves = this.game.getLegalMoves(this.game.turn);
        this.currentLegalMoves = allMoves.filter(m =>
            !m.drop && m.from.x === fx && m.from.y === fy
        );
    }

    async onMoveMade() {
        this.render();
        const lastMove = this.game.history[this.game.history.length - 1];
        if (lastMove) {
            // The player who just moved is the one BEFORE turn switched
            const movedPlayer = this.game.turn === SENTE ? GOTE : SENTE;
            const hadCapture = lastMove.captured != null;
            this.playSound(hadCapture ? 'capture' : 'move');
            // Wait a moment for sound, then narrate and await completion
            await new Promise(r => setTimeout(r, 120));
            await this.narrateMove(lastMove, movedPlayer);
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

            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'select') {
                // 選択音: 軽いクリック
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.05);
            }
        } catch (e) {
            // Audio not supported
            console.error('Audio error:', e);
        }
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

            const text = `${playerName}、${moveText}`;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Prefer Japanese voice
            const voices = window.speechSynthesis.getVoices();
            const jaVoice = voices.find(v => v.lang.startsWith('ja'));
            if (jaVoice) utterance.voice = jaVoice;

            // Safety timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.warn('Speech synthesis timeout');
                resolve();
            }, 1500);

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
            }, 50); // Small delay after cancel
        });
    }
}
