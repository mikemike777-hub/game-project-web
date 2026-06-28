class AI {
    constructor(game, level) {
        this.game = game;
        this.level = level; // 'easy', 'normal', 'hard', 'expert'
        this.nodesVisited = 0;
        this.transpositionTable = new Map();
        this.searchDeadline = 0;

        // Piece Values (Base)
        this.VALUES = {
            1: 100,  // 歩
            2: 300,  // 香
            3: 300,  // 桂
            4: 500,  // 銀
            5: 600,  // 金
            6: 800,  // 角
            7: 1000, // 飛
            8: 20000, // 王
            11: 180, // と金 (+80)
            12: 370, // 成香 (+70)
            13: 370, // 成桂 (+70)
            14: 570, // 成銀 (+70)
            16: 950, // 馬 (+150)
            17: 1200 // 竜 (+200)
        };
    }

    async makeMove() {
        this.nodesVisited = 0;
        this.transpositionTable.clear();
        const budget = this.getTimeBudget();
        this.searchDeadline = budget ? Date.now() + budget : 0;

        return new Promise(resolve => {
            const startTime = Date.now();
            const color = this.game.turn;
            const moves = this.game.getLegalMoves(color);

            if (moves.length === 0) {
                resolve(false);
                return;
            }

            let bestMove = null;

            if (this.level === 'easy') {
                bestMove = this.searchEasy(moves);
            } else if (this.level === 'normal') {
                bestMove = this.searchNormal(moves, color);
            } else if (this.level === 'hard') {
                bestMove = this.searchHard(moves, color);
            } else {
                bestMove = this.searchExpert(moves, color);
            }

            // Visual delay if search was too fast
            const elapsed = Date.now() - startTime;
            const delay = Math.max(0, 180 - elapsed);

            setTimeout(() => {
                if (typeof window !== 'undefined' && window.DEBUG_AI) {
                    console.log(`AI [${this.level}] Nodes: ${this.nodesVisited}, Time: ${elapsed}ms`);
                }
                if (bestMove.drop) {
                    this.game.drop(bestMove.to.x, bestMove.to.y, bestMove.type);
                } else {
                    this.game.move(bestMove.from.x, bestMove.from.y, bestMove.to.x, bestMove.to.y, bestMove.promote);
                }
                resolve(true);
            }, delay);
        });
    }

    // --- SEARCH STRATEGIES ---

    searchEasy(moves) {
        // Depth 2 equivalent but simplified
        // Just pick the move that yields the best board score after 1 turn
        let bestScore = -Infinity;
        let best = moves[0];
        const color = this.game.turn;

        for (const m of moves) {
            this.game.pushMove(m);
            // Current player is opponent now, so we evaluate from original POV
            const score = this.evaluateMaterial() * (color === SENTE ? 1 : -1);
            this.game.popMove();

            // Add +/- 10% randomness
            const noise = score * (Math.random() * 0.2 - 0.1);
            if (score + noise > bestScore) {
                bestScore = score + noise;
                best = m;
            }
        }
        return best;
    }

    searchNormal(moves, color) {
        const depth = 2;
        const result = this.alphaBeta(depth, -Infinity, Infinity, true, color);
        return result.move || moves[Math.floor(Math.random() * moves.length)];
    }

    searchHard(moves, color) {
        const depth = 3;
        // Use move ordering and fuller evaluation
        const result = this.alphaBeta(depth, -Infinity, Infinity, true, color);
        return result.move || moves[Math.floor(Math.random() * moves.length)];
    }

    searchExpert(moves, color) {
        // Iterative Deepening
        const maxDepth = 5;
        const timeLimit = 1100;
        const startTime = Date.now();
        let currentBestMove = moves[0];

        for (let d = 1; d <= maxDepth; d++) {
            const timeElapsed = Date.now() - startTime;
            if (timeElapsed > timeLimit && d > 1) break;

            const result = this.alphaBeta(d, -Infinity, Infinity, true, color);
            if (result.move) currentBestMove = result.move;
            if (this.isTimeUp()) break;
        }
        return currentBestMove;
    }

    // --- CORE SEARCH ---

    alphaBeta(depth, alpha, beta, isMax, color) {
        this.nodesVisited++;
        if (this.isTimeUp()) {
            return { score: this.evaluate() * (color === SENTE ? 1 : -1) };
        }

        // Transposition Table Check
        const boardKey = `${depth}:${isMax ? 1 : 0}:${this.getBoardHash()}`;
        const cached = this.transpositionTable.get(boardKey);
        if (cached && cached.depth >= depth) return cached;

        if (depth === 0 || this.game.isGameOver) {
            return { score: this.evaluate() * (color === SENTE ? 1 : -1) };
        }

        const turn = this.game.turn;
        let moves = this.game.getLegalMoves(turn);

        // Move Ordering (for Hard/Expert)
        if (this.level === 'hard' || this.level === 'expert') {
            moves = this.orderMoves(moves).slice(0, this.getMoveLimit(depth));
        }

        let bestMove = null;

        if (isMax) {
            let maxEval = -Infinity;
            for (const m of moves) {
                this.game.pushMove(m);
                const evalResult = this.alphaBeta(depth - 1, alpha, beta, false, color);
                this.game.popMove();

                if (evalResult.score > maxEval) {
                    maxEval = evalResult.score;
                    bestMove = m;
                }
                alpha = Math.max(alpha, evalResult.score);
                if (beta <= alpha) break;
            }
            const res = { score: maxEval, move: bestMove, depth };
            this.transpositionTable.set(boardKey, res);
            return res;
        } else {
            let minEval = Infinity;
            for (const m of moves) {
                this.game.pushMove(m);
                const evalResult = this.alphaBeta(depth - 1, alpha, beta, true, color);
                this.game.popMove();

                if (evalResult.score < minEval) {
                    minEval = evalResult.score;
                    bestMove = m;
                }
                beta = Math.min(beta, evalResult.score);
                if (beta <= alpha) break;
            }
            const res = { score: minEval, move: bestMove, depth };
            this.transpositionTable.set(boardKey, res);
            return res;
        }
    }

    // --- EVALUATOR ---

    evaluate() {
        if (this.game.isGameOver) {
            if (this.game.winner === SENTE) return 100000;
            if (this.game.winner === GOTE) return -100000;
            return 0;
        }

        let score = 0;
        score += this.evaluateMaterial();

        if (this.level === 'hard' || this.level === 'expert') {
            score += this.evaluateKingSafety();
            score += this.evaluateCheckBonus();
        }

        return score;
    }

    evaluateMaterial() {
        let score = 0;
        // Board
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = this.game.board[x][y];
                if (p) {
                    const val = this.VALUES[p.type] || 0;
                    score += (p.player === SENTE ? val : -val);
                }
            }
        }
        // Hands
        this.game.hands[SENTE].forEach(t => score += (this.VALUES[t] * 0.9));
        this.game.hands[GOTE].forEach(t => score -= (this.VALUES[t] * 0.9));

        return score;
    }

    evaluateKingSafety() {
        let score = 0;
        const kingPos = this.getKingPositions();

        // Sente King
        if (kingPos[SENTE]) {
            score += this.getKingSurroundingBonus(kingPos[SENTE].x, kingPos[SENTE].y, SENTE);
            // Penalty for being in center
            const centerDist = Math.abs(kingPos[SENTE].x - 4) + Math.abs(kingPos[SENTE].y - 7);
            score -= centerDist * 10;
        }

        // Gote King
        if (kingPos[GOTE]) {
            score -= this.getKingSurroundingBonus(kingPos[GOTE].x, kingPos[GOTE].y, GOTE);
            const centerDist = Math.abs(kingPos[GOTE].x - 4) + Math.abs(kingPos[GOTE].y - 1);
            score += centerDist * 10;
        }

        return score;
    }

    getKingSurroundingBonus(kx, ky, player) {
        let bonus = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = kx + dx, ny = ky + dy;
                if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
                    const p = this.game.board[nx][ny];
                    if (p && p.player === player) bonus += 30; // Guard bonus
                }
            }
        }
        return bonus;
    }

    evaluateCheckBonus() {
        // Bonus if opponent is in check
        let bonus = 0;
        if (this.game.isInCheck(GOTE)) bonus += 150;
        if (this.game.isInCheck(SENTE)) bonus -= 150;
        return bonus;
    }

    // --- UTILS ---

    orderMoves(moves) {
        return moves.map(m => {
            let weight = 0;
            // 1. Captures and promotion
            if (!m.drop) {
                const target = this.game.board[m.to.x][m.to.y];
                if (target) {
                    weight += 5000 + (this.VALUES[target.type] - (this.VALUES[this.game.board[m.from.x][m.from.y]?.type] || 0) / 100);
                }
                if (m.promote) weight += 2000;
            } else {
                weight += 250;
            }

            // 2. High value piece movement
            if (!m.drop) {
                const piece = this.game.board[m.from.x][m.from.y];
                if (piece) weight += this.VALUES[piece.type] / 10;
            }

            return { m, weight };
        })
            .sort((a, b) => b.weight - a.weight)
            .map(x => x.m);
    }

    getTimeBudget() {
        if (this.level === 'hard') return 650;
        if (this.level === 'expert') return 1100;
        return 0;
    }

    getMoveLimit(depth) {
        if (this.level === 'expert') return depth >= 3 ? 26 : 34;
        if (this.level === 'hard') return depth >= 2 ? 22 : 30;
        return 40;
    }

    isTimeUp() {
        return this.searchDeadline > 0 && Date.now() >= this.searchDeadline;
    }

    getKingPositions() {
        const pos = {};
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = this.game.board[x][y];
                if (p && p.type === 8) pos[p.player] = { x, y };
            }
        }
        return pos;
    }

    getBoardHash() {
        // Simple hash for Transposition Table
        // In a real engine, use Zobrist hashing
        let s = "";
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                const p = this.game.board[x][y];
                if (p) s += `${x}${y}${p.player}${p.type}`;
            }
        }
        s += `T${this.game.turn}`;
        s += `H${this.game.hands[SENTE].join('')}|${this.game.hands[GOTE].join('')}`;
        return s;
    }
}
