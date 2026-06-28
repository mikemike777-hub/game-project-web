/**
 * THE Shogi - Game Logic
 */

const PIECES = {
    EMPTY: 0,
    FU: 1, KY: 2, KE: 3, GI: 4, KI: 5, KA: 6, HI: 7, OU: 8,
    TO: 11, NY: 12, NK: 13, NG: 14, UM: 16, RY: 17
};

var SENTE = 0;
var GOTE = 1;

class Shogi {
    constructor() {
        this.board = [];
        this.hands = [[], []];
        this.turn = SENTE;
        this.history = [];
        this.isGameOver = false;
        this.winner = null;
        this.foul = null;
        this.init();
    }

    pushMove(move) {
        let captured = null;
        const fromPiece = move.drop ? null : { ...this.board[move.from.x][move.from.y] };

        if (move.drop) {
            const handIndex = this.hands[this.turn].indexOf(move.type);
            this.hands[this.turn].splice(handIndex, 1);
            this.board[move.to.x][move.to.y] = { type: move.type, player: this.turn };
        } else {
            const target = this.board[move.to.x][move.to.y];
            if (target) {
                captured = target.type;
                this.addToHand(this.turn, target.type);
            }
            const newType = move.promote ? this.promotePiece(fromPiece.type) : fromPiece.type;
            this.board[move.to.x][move.to.y] = { type: newType, player: fromPiece.player };
            this.board[move.from.x][move.from.y] = null;
        }

        this.history.push({ ...move, _captured: captured, _fromPiece: fromPiece });
        this.turn = this.turn === SENTE ? GOTE : SENTE;
    }

    popMove() {
        const move = this.history.pop();
        if (!move) return;

        this.turn = this.turn === SENTE ? GOTE : SENTE;

        if (move.drop) {
            this.board[move.to.x][move.to.y] = null;
            this.hands[this.turn].push(move.type);
            this.hands[this.turn].sort((a, b) => a - b);
        } else {
            // Restore from piece
            this.board[move.from.x][move.from.y] = move._fromPiece;
            // Restore captured piece if any
            if (move._captured) {
                const opponent = this.turn === SENTE ? GOTE : SENTE;
                const handIndex = this.hands[this.turn].lastIndexOf(this.demotePiece(move._captured));
                if (handIndex !== -1) this.hands[this.turn].splice(handIndex, 1);
                this.board[move.to.x][move.to.y] = { type: move._captured, player: opponent };
            } else {
                this.board[move.to.x][move.to.y] = null;
            }
        }
    }

    init() {
        this.board = this.createInitialBoard();
        this.hands = [[], []];
        this.turn = SENTE;
        this.history = [];
        this.isGameOver = false;
        this.winner = null;
        this.foul = null;
    }

    createInitialBoard() {
        const b = Array(9).fill(null).map(() => Array(9).fill(null));
        const place = (x, y, type, player) => { b[x][y] = { type, player }; };

        // Gote (Top, y=0)
        place(0, 0, PIECES.KY, GOTE); place(1, 0, PIECES.KE, GOTE); place(2, 0, PIECES.GI, GOTE); place(3, 0, PIECES.KI, GOTE);
        place(4, 0, PIECES.OU, GOTE);
        place(5, 0, PIECES.KI, GOTE); place(6, 0, PIECES.GI, GOTE); place(7, 0, PIECES.KE, GOTE); place(8, 0, PIECES.KY, GOTE);
        place(1, 1, PIECES.HI, GOTE); place(7, 1, PIECES.KA, GOTE);
        for (let i = 0; i < 9; i++) place(i, 2, PIECES.FU, GOTE);

        // Sente (Bottom, y=8)
        for (let i = 0; i < 9; i++) place(i, 6, PIECES.FU, SENTE);
        place(1, 7, PIECES.KA, SENTE); place(7, 7, PIECES.HI, SENTE);
        place(0, 8, PIECES.KY, SENTE); place(1, 8, PIECES.KE, SENTE); place(2, 8, PIECES.GI, SENTE); place(3, 8, PIECES.KI, SENTE);
        place(4, 8, PIECES.OU, SENTE);
        place(5, 8, PIECES.KI, SENTE); place(6, 8, PIECES.GI, SENTE); place(7, 8, PIECES.KE, SENTE); place(8, 8, PIECES.KY, SENTE);

        return b;
    }

    // Get movement definition for a piece type and player
    getDirections(type, player) {
        const fwd = player === SENTE ? -1 : 1;
        const goldDirs = [[-1, fwd], [0, fwd], [1, fwd], [-1, 0], [1, 0], [0, -fwd]];

        switch (type) {
            case PIECES.FU: return { type: 'step', dirs: [[0, fwd]] };
            case PIECES.KY: return { type: 'ray', dirs: [[0, fwd]] };
            case PIECES.KE: return { type: 'step', dirs: [[-1, fwd * 2], [1, fwd * 2]] };
            case PIECES.GI: return { type: 'step', dirs: [[-1, fwd], [0, fwd], [1, fwd], [-1, -fwd], [1, -fwd]] };
            case PIECES.KI: return { type: 'step', dirs: goldDirs };
            case PIECES.OU: return { type: 'step', dirs: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] };
            case PIECES.KA: return { type: 'ray', dirs: [[-1, -1], [1, -1], [-1, 1], [1, 1]] };
            case PIECES.HI: return { type: 'ray', dirs: [[0, -1], [0, 1], [-1, 0], [1, 0]] };
            case PIECES.UM: return { type: 'mixed', rays: [[-1, -1], [1, -1], [-1, 1], [1, 1]], steps: [[0, -1], [0, 1], [-1, 0], [1, 0]] };
            case PIECES.RY: return { type: 'mixed', rays: [[0, -1], [0, 1], [-1, 0], [1, 0]], steps: [[-1, -1], [1, -1], [-1, 1], [1, 1]] };
            case PIECES.TO:
            case PIECES.NY:
            case PIECES.NK:
            case PIECES.NG: return { type: 'step', dirs: goldDirs };
            default: return { type: 'step', dirs: [] };
        }
    }

    // Generate all pseudo-legal moves for a piece at (cx,cy)
    generateMovesForPiece(cx, cy, player, moves) {
        const piece = this.board[cx][cy];
        if (!piece || piece.player !== player) return;
        const moveDef = this.getDirections(piece.type, player);

        const addMove = (nx, ny) => {
            if (nx < 0 || nx >= 9 || ny < 0 || ny >= 9) return;
            const target = this.board[nx][ny];
            if (target && target.player === player) return; // Friendly piece

            const promotable = this.isPromotableType(piece.type);
            const inZone = this.canPromote(cy, ny, player);

            if (promotable && inZone) {
                if (this.mustPromote(ny, piece.type, player)) {
                    moves.push({ from: { x: cx, y: cy }, to: { x: nx, y: ny }, promote: true });
                } else {
                    moves.push({ from: { x: cx, y: cy }, to: { x: nx, y: ny }, promote: true });
                    moves.push({ from: { x: cx, y: cy }, to: { x: nx, y: ny }, promote: false });
                }
            } else {
                moves.push({ from: { x: cx, y: cy }, to: { x: nx, y: ny }, promote: false });
            }
        };

        if (moveDef.type === 'step') {
            for (const d of moveDef.dirs) addMove(cx + d[0], cy + d[1]);
        } else if (moveDef.type === 'ray') {
            for (const d of moveDef.dirs) {
                let nx = cx + d[0], ny = cy + d[1];
                while (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                    const t = this.board[nx][ny];
                    addMove(nx, ny);
                    if (t) break;
                    nx += d[0]; ny += d[1];
                }
            }
        } else if (moveDef.type === 'mixed') {
            for (const d of moveDef.rays) {
                let nx = cx + d[0], ny = cy + d[1];
                while (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                    const t = this.board[nx][ny];
                    addMove(nx, ny);
                    if (t) break;
                    nx += d[0]; ny += d[1];
                }
            }
            for (const d of moveDef.steps) addMove(cx + d[0], cy + d[1]);
        }
    }

    // Check if a player's king is in check on a given board state
    isInCheck(player, board) {
        board = board || this.board;
        const opponent = player === SENTE ? GOTE : SENTE;

        // Find king position
        let kx = -1, ky = -1;
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = board[x][y];
                if (p && p.player === player && p.type === PIECES.OU) {
                    kx = x; ky = y;
                }
            }
        }
        if (kx === -1) return false; // King not found (captured)

        // Check if any opponent piece attacks the king
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = board[x][y];
                if (!p || p.player !== opponent) continue;
                const attacks = [];
                // Temporarily use board for attack generation
                const savedBoard = this.board;
                this.board = board;
                this.generateMovesForPiece(x, y, opponent, attacks);
                this.board = savedBoard;
                if (attacks.some(m => m.to.x === kx && m.to.y === ky)) return true;
            }
        }
        return false;
    }

    // Apply a move to a board copy and return the new board
    applyMoveToBoard(board, move) {
        const newBoard = board.map(col => col.map(cell => cell ? { ...cell } : null));
        if (move.drop) {
            newBoard[move.to.x][move.to.y] = { type: move.type, player: move.player };
        } else {
            const piece = newBoard[move.from.x][move.from.y];
            const newType = move.promote ? this.promotePiece(piece.type) : piece.type;
            newBoard[move.to.x][move.to.y] = { type: newType, player: piece.player };
            newBoard[move.from.x][move.from.y] = null;
        }
        return newBoard;
    }

    getPseudoMoves(player, options = {}) {
        const includeIllegalDrops = Boolean(options.includeIllegalDrops);
        const pseudoMoves = [];

        // Board moves
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                this.generateMovesForPiece(x, y, player, pseudoMoves);
            }
        }

        // Drop moves
        const hand = this.hands[player];
        const uniqueTypes = [...new Set(hand)];
        for (const type of uniqueTypes) {
            for (let x = 0; x < 9; x++) {
                for (let y = 0; y < 9; y++) {
                    if (this.board[x][y] === null && (includeIllegalDrops || this.canDrop(x, y, type, player))) {
                        pseudoMoves.push({ from: null, to: { x, y }, type, player, drop: true });
                    }
                }
            }
        }

        return pseudoMoves;
    }

    // Moves are intentionally not filtered by king safety.
    getLegalMoves(player) {
        return this.getPseudoMoves(player, { includeIllegalDrops: false });
    }

    getPlayableMoves(player) {
        return this.getPseudoMoves(player, { includeIllegalDrops: true });
    }

    isPromotableType(type) {
        return [PIECES.FU, PIECES.KY, PIECES.KE, PIECES.GI, PIECES.KA, PIECES.HI].includes(type);
    }

    canPromote(fromY, toY, player) {
        const zone = player === SENTE ? [0, 1, 2] : [6, 7, 8];
        return zone.includes(fromY) || zone.includes(toY);
    }

    mustPromote(y, type, player) {
        if (player === SENTE) {
            if (type === PIECES.FU || type === PIECES.KY) return y === 0;
            if (type === PIECES.KE) return y <= 1;
        } else {
            if (type === PIECES.FU || type === PIECES.KY) return y === 8;
            if (type === PIECES.KE) return y >= 7;
        }
        return false;
    }

    canDrop(x, y, type, player) {
        return this.getDropViolation(x, y, type, player) === null;
    }

    getDropViolation(x, y, type, player) {
        if (this.board[x][y] !== null) {
            return {
                code: 'occupied',
                reason: '駒のある場所には打てません。',
                square: this.formatSquare(x, y)
            };
        }

        if (type === PIECES.FU) {
            // Nifu check
            for (let row = 0; row < 9; row++) {
                const p = this.board[x][row];
                if (p && p.player === player && p.type === PIECES.FU) {
                    return {
                        code: 'nifu',
                        reason: `二歩です。${this.formatFile(x)}には、すでに${this.formatSquare(x, row)}に歩があります。`,
                        square: this.formatSquare(x, y),
                        existingPawn: { x, y: row }
                    };
                }
            }
            if (player === SENTE && y === 0) return {
                code: 'dead_drop',
                reason: '歩を一段目には打てません。',
                square: this.formatSquare(x, y)
            };
            if (player === GOTE && y === 8) return {
                code: 'dead_drop',
                reason: '歩を九段目には打てません。',
                square: this.formatSquare(x, y)
            };
        }
        if (type === PIECES.KY) {
            if (player === SENTE && y === 0) return {
                code: 'dead_drop',
                reason: '香車を一段目には打てません。',
                square: this.formatSquare(x, y)
            };
            if (player === GOTE && y === 8) return {
                code: 'dead_drop',
                reason: '香車を九段目には打てません。',
                square: this.formatSquare(x, y)
            };
        }
        if (type === PIECES.KE) {
            if (player === SENTE && y <= 1) return {
                code: 'dead_drop',
                reason: '桂馬を一段目・二段目には打てません。',
                square: this.formatSquare(x, y)
            };
            if (player === GOTE && y >= 7) return {
                code: 'dead_drop',
                reason: '桂馬を八段目・九段目には打てません。',
                square: this.formatSquare(x, y)
            };
        }
        return null;
    }

    formatSquare(x, y) {
        const ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
        return `${9 - x}${ranks[y]}`;
    }

    formatFile(x) {
        return `${9 - x}筋`;
    }

    declareFoul(player, violation) {
        const winner = player === SENTE ? GOTE : SENTE;
        this.isGameOver = true;
        this.winner = winner;
        this.foul = {
            player,
            winner,
            ...violation
        };
        this.turn = winner;
    }

    move(fromX, fromY, toX, toY, promote) {
        const piece = this.board[fromX][fromY];
        if (!piece || piece.player !== this.turn) return false;

        const target = this.board[toX][toY];
        let captured = null;

        if (target) {
            if (target.player === this.turn) return false;
            captured = target.type;
            // Check if king is captured -> game over
            if (target.type === PIECES.OU) {
                this.board[toX][toY] = { type: promote ? this.promotePiece(piece.type) : piece.type, player: this.turn };
                this.board[fromX][fromY] = null;
                this.isGameOver = true;
                this.winner = this.turn;
                this.history.push({ type: 'move', from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, piece: piece.type, promote, captured });
                this.turn = this.turn === SENTE ? GOTE : SENTE;
                return true;
            }
            this.addToHand(this.turn, target.type);
        }

        const newType = promote ? this.promotePiece(piece.type) : piece.type;
        this.board[toX][toY] = { type: newType, player: this.turn };
        this.board[fromX][fromY] = null;

        this.history.push({ type: 'move', from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, piece: piece.type, promote, captured });
        this.turn = this.turn === SENTE ? GOTE : SENTE;
        return true;
    }

    drop(x, y, type) {
        if (this.board[x][y] !== null) return false;
        const handIndex = this.hands[this.turn].indexOf(type);
        if (handIndex === -1) return false;
        const violation = this.getDropViolation(x, y, type, this.turn);
        const player = this.turn;

        this.hands[player].splice(handIndex, 1);
        this.board[x][y] = { type, player };
        this.history.push({ type: 'drop', to: { x, y }, piece: type, violation });

        if (violation) {
            this.declareFoul(player, violation);
            return true;
        }

        this.turn = this.turn === SENTE ? GOTE : SENTE;
        return true;
    }

    addToHand(player, type) {
        const rawType = this.demotePiece(type);
        this.hands[player].push(rawType);
        this.hands[player].sort((a, b) => a - b);
    }

    promotePiece(type) {
        const map = { [PIECES.FU]: PIECES.TO, [PIECES.KY]: PIECES.NY, [PIECES.KE]: PIECES.NK, [PIECES.GI]: PIECES.NG, [PIECES.KA]: PIECES.UM, [PIECES.HI]: PIECES.RY };
        return map[type] || type;
    }

    demotePiece(type) {
        const map = { [PIECES.TO]: PIECES.FU, [PIECES.NY]: PIECES.KY, [PIECES.NK]: PIECES.KE, [PIECES.NG]: PIECES.GI, [PIECES.UM]: PIECES.KA, [PIECES.RY]: PIECES.HI };
        return map[type] || type;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Shogi, PIECES, SENTE, GOTE };
}
