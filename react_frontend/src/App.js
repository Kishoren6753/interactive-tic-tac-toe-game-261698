import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const BOARD_SIZE = 9;

const PLAYER_X = "X";
const PLAYER_O = "O";

/**
 * @typedef {"human"|"computer"} PlayerType
 */

/**
 * @typedef {"pvp"|"ai"} GameMode
 */

/**
 * @typedef {"easy"|"medium"|"hard"} AIDifficulty
 */

/**
 * Calculates the winner (if any) for a given board.
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {{winner: ("X"|"O"|null), line: number[]|null}}
 */
function calculateWinner(squares) {
  const lines = [
    // rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // cols
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // diagonals
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    const v = squares[a];
    if (v && v === squares[b] && v === squares[c]) {
      return { winner: v, line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

/**
 * Returns true when the board is full (no null squares).
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {boolean}
 */
function isBoardFull(squares) {
  return squares.every((s) => s !== null);
}

/**
 * Convert an index 0..8 to a human-friendly label like "Row 1, Col 1".
 * @param {number} index
 * @returns {string}
 */
function indexToRowColLabel(index) {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  return `Row ${row}, Col ${col}`;
}

/**
 * A single square on the board.
 * @param {{value: ("X"|"O"|null), onClick: () => void, disabled: boolean, isWinning: boolean, index: number}} props
 */
function Square({ value, onClick, disabled, isWinning, index }) {
  const aria = value
    ? `Square ${indexToRowColLabel(index)}: ${value}`
    : `Square ${indexToRowColLabel(index)}: empty`;

  return (
    <button
      type="button"
      className={`ttt-square ${isWinning ? "is-winning" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
    >
      <span className={`ttt-mark ${value ? "is-set" : ""}`}>{value ?? ""}</span>
    </button>
  );
}

/**
 * @typedef {{x: number, o: number, draws: number}} Scoreboard
 */

/**
 * Creates a zeroed scoreboard.
 * @returns {Scoreboard}
 */
function createEmptyScoreboard() {
  return { x: 0, o: 0, draws: 0 };
}

/**
 * Returns a list of indexes that are still empty.
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {number[]}
 */
function getAvailableMoves(squares) {
  const moves = [];
  for (let i = 0; i < squares.length; i += 1) {
    if (squares[i] === null) moves.push(i);
  }
  return moves;
}

/**
 * Returns a random available move index from the board.
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {number|null}
 */
function findRandomMove(squares) {
  const moves = getAvailableMoves(squares);
  if (moves.length === 0) return null;
  const pick = Math.floor(Math.random() * moves.length);
  return moves[pick];
}

/**
 * Find an immediate winning move for a given player (if it exists).
 * @param {Array<("X"|"O"|null)>} squares
 * @param {"X"|"O"} player
 * @returns {number|null}
 */
function findImmediateWinningMove(squares, player) {
  const moves = getAvailableMoves(squares);
  for (const idx of moves) {
    const next = squares.slice();
    next[idx] = player;
    const { winner } = calculateWinner(next);
    if (winner === player) return idx;
  }
  return null;
}

/**
 * Medium difficulty AI:
 * 1) take an immediate win if available
 * 2) block opponent's immediate win
 * 3) prefer center, then corners, then edges
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {number|null}
 */
function findMediumMoveForComputer(squares) {
  const { winner } = calculateWinner(squares);
  if (winner || isBoardFull(squares)) return null;

  const computer = PLAYER_O;
  const human = PLAYER_X;

  const winningMove = findImmediateWinningMove(squares, computer);
  if (winningMove !== null) return winningMove;

  const blockMove = findImmediateWinningMove(squares, human);
  if (blockMove !== null) return blockMove;

  const preferenceOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const idx of preferenceOrder) {
    if (squares[idx] === null) return idx;
  }

  return null;
}

/**
 * Computes the best move for the computer using minimax.
 * Assumptions for this app:
 * - In AI mode, human is always X and computer is always O.
 * @param {Array<("X"|"O"|null)>} squares
 * @returns {number|null} Index to play or null if no move
 */
function findBestMoveForComputer(squares) {
  const { winner } = calculateWinner(squares);
  if (winner || isBoardFull(squares)) return null;

  const computer = PLAYER_O;
  const human = PLAYER_X;

  /**
   * Minimax evaluator.
   * Scores are from the computer's perspective:
   * - O win => +10 - depth (prefer faster wins)
   * - X win => -10 + depth (prefer slower losses)
   * - draw => 0
   * @param {Array<("X"|"O"|null)>} board
   * @param {number} depth
   * @param {boolean} isMaximizing
   * @returns {number}
   */
  function minimax(board, depth, isMaximizing) {
    const res = calculateWinner(board);
    if (res.winner === computer) return 10 - depth;
    if (res.winner === human) return -10 + depth;
    if (isBoardFull(board)) return 0;

    const moves = getAvailableMoves(board);
    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of moves) {
        const next = board.slice();
        next[idx] = computer;
        best = Math.max(best, minimax(next, depth + 1, false));
      }
      return best;
    }

    let best = Infinity;
    for (const idx of moves) {
      const next = board.slice();
      next[idx] = human;
      best = Math.min(best, minimax(next, depth + 1, true));
    }
    return best;
  }

  // Choose move with best score; apply small tie-break to prefer center/corners.
  const preference = {
    4: 3, // center
    0: 2,
    2: 2,
    6: 2,
    8: 2, // corners
  };

  let bestScore = -Infinity;
  let bestMove = null;

  for (const idx of getAvailableMoves(squares)) {
    const next = squares.slice();
    next[idx] = computer;
    const score = minimax(next, 0, false);

    const tieBreak = preference[idx] ?? 0;
    const combined = score * 10 + tieBreak; // keep minimax dominant

    if (combined > bestScore) {
      bestScore = combined;
      bestMove = idx;
    }
  }

  return bestMove;
}

// PUBLIC_INTERFACE
function App() {
  /**
   * squares: Array length 9: "X" | "O" | null
   * xIsNext: boolean toggles current player
   */
  const [squares, setSquares] = useState(() => Array(BOARD_SIZE).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  /**
   * Game mode:
   * - pvp: X vs O (both human)
   * - ai: human (X) vs computer (O)
   */
  const [mode, setMode] = useState(/** @type {GameMode} */ ("pvp"));

  /**
   * AI difficulty (used only in AI mode).
   * - easy: random move
   * - medium: simple tactics + positional preference
   * - hard: minimax (existing behavior)
   */
  const [aiDifficulty, setAiDifficulty] = useState(
    /** @type {AIDifficulty} */ ("hard")
  );

  /**
   * When true, the AI is "thinking"/making its move; used to lock UI input.
   */
  const [isComputerThinking, setIsComputerThinking] = useState(false);

  /**
   * In-session scoreboard (resets on refresh).
   * Tracks X wins, O wins, and draws across games.
   */
  const [scoreboard, setScoreboard] = useState(() => createEmptyScoreboard());

  /**
   * Internal guard to ensure we only count a finished game once.
   * Example: once a winner is determined, subsequent renders should not re-increment.
   */
  const [hasCountedResult, setHasCountedResult] = useState(false);

  const { winner, line: winningLine } = useMemo(
    () => calculateWinner(squares),
    [squares]
  );

  const isDraw = !winner && isBoardFull(squares);
  const gameOver = Boolean(winner) || isDraw;

  const currentPlayer = xIsNext ? PLAYER_X : PLAYER_O;
  const isAiMode = mode === "ai";
  const isComputersTurn = isAiMode && currentPlayer === PLAYER_O;

  const prevGameOverRef = useRef(gameOver);

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "Draw — no winner";
    if (isComputerThinking) return "Computer is thinking…";
    if (isAiMode) return `Turn: ${currentPlayer} (${isComputersTurn ? "Computer" : "You"})`;
    return `Turn: ${currentPlayer}`;
  }, [winner, isDraw, isComputerThinking, isAiMode, currentPlayer, isComputersTurn]);

  /**
   * Increment scoreboard exactly once when the game ends.
   * The `hasCountedResult` flag ensures the effect is idempotent for a given game.
   */
  useEffect(() => {
    if (!gameOver || hasCountedResult) return;

    setScoreboard((prev) => {
      if (winner === PLAYER_X) return { ...prev, x: prev.x + 1 };
      if (winner === PLAYER_O) return { ...prev, o: prev.o + 1 };
      // draw
      return { ...prev, draws: prev.draws + 1 };
    });

    setHasCountedResult(true);
  }, [gameOver, hasCountedResult, winner]);

  /**
   * When switching from an ended game to a new game (restart/reset/mode switch),
   * clear any pending "thinking" state.
   */
  useEffect(() => {
    const prev = prevGameOverRef.current;
    prevGameOverRef.current = gameOver;
    if (prev && !gameOver) {
      setIsComputerThinking(false);
    }
  }, [gameOver]);

  /**
   * AI move effect: whenever it's the computer's turn, schedule one move.
   * We intentionally add a small delay for UX and to make tests deterministic via timers.
   */
  useEffect(() => {
    if (!isAiMode) return;
    if (gameOver) return;
    if (!isComputersTurn) return;
    if (isComputerThinking) return;

    const move =
      aiDifficulty === "easy"
        ? findRandomMove(squares)
        : aiDifficulty === "medium"
          ? findMediumMoveForComputer(squares)
          : findBestMoveForComputer(squares);
    if (move === null) return;

    setIsComputerThinking(true);

    const t = window.setTimeout(() => {
      setSquares((prevSquares) => {
        // Re-check with freshest state to avoid applying a stale move.
        const { winner: w } = calculateWinner(prevSquares);
        if (w || isBoardFull(prevSquares)) return prevSquares;
        if (prevSquares[move] !== null) return prevSquares;

        const next = prevSquares.slice();
        next[move] = PLAYER_O;
        return next;
      });

      setXIsNext(true); // after O move, back to X
      setIsComputerThinking(false);
    }, 250);

    return () => window.clearTimeout(t);
  }, [
    isAiMode,
    gameOver,
    isComputersTurn,
    isComputerThinking,
    squares,
    aiDifficulty,
  ]);

  // PUBLIC_INTERFACE
  function handleSquareClick(i) {
    /**
     * Ignore clicks when:
     * - game finished
     * - square already set
     * - computer is thinking
     * - it's computer's turn (AI mode)
     */
    if (gameOver || squares[i] !== null) return;
    if (isComputerThinking) return;
    if (isComputersTurn) return;

    const next = squares.slice();
    next[i] = currentPlayer;

    setSquares(next);
    setXIsNext((v) => !v);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    /** Reset the current game (keeps scoreboard). */
    setSquares(Array(BOARD_SIZE).fill(null));
    setXIsNext(true);
    setHasCountedResult(false);
    setIsComputerThinking(false);
  }

  // PUBLIC_INTERFACE
  function handleResetScores() {
    /** Reset the scoreboard and also restart the current game. */
    setScoreboard(createEmptyScoreboard());
    setSquares(Array(BOARD_SIZE).fill(null));
    setXIsNext(true);
    setHasCountedResult(false);
    setIsComputerThinking(false);
  }

  // PUBLIC_INTERFACE
  function handleModeChange(nextMode) {
    /**
     * Switch game mode and restart the board.
     * Scoreboard is preserved (same session), since it still represents results.
     */
    setMode(nextMode);
    setSquares(Array(BOARD_SIZE).fill(null));
    setXIsNext(true);
    setHasCountedResult(false);
    setIsComputerThinking(false);
  }

  // PUBLIC_INTERFACE
  function handleDifficultyChange(nextDifficulty) {
    /**
     * Switch AI difficulty and restart the current board for clarity.
     * Scoreboard is preserved (same session).
     * Note: only applicable in AI mode; UI hides these controls in PvP.
     * @param {AIDifficulty} nextDifficulty
     */
    setAiDifficulty(nextDifficulty);
    setSquares(Array(BOARD_SIZE).fill(null));
    setXIsNext(true);
    setHasCountedResult(false);
    setIsComputerThinking(false);
  }

  const boardLocked = gameOver || isComputerThinking || isComputersTurn;

  return (
    <div className="App">
      <main className="ttt-page">
        <section className="ttt-card" aria-label="Tic Tac Toe">
          <header className="ttt-header">
            <div className="ttt-title-block">
              <h1 className="ttt-title">Tic Tac Toe</h1>
              <p className="ttt-subtitle">Retro vibes. Modern polish.</p>
            </div>

            <div
              className={`ttt-status ${winner ? "is-winner" : ""} ${
                isDraw ? "is-draw" : ""
              }`}
              role="status"
              aria-live="polite"
            >
              {statusText}
            </div>

            <section className="ttt-scoreboard" aria-label="Scoreboard">
              <div className="ttt-scoreboard-grid" role="group" aria-label="Scores">
                <div className="ttt-score">
                  <div className="ttt-score-label">X Wins</div>
                  <div className="ttt-score-value" aria-label={`X wins: ${scoreboard.x}`}>
                    {scoreboard.x}
                  </div>
                </div>
                <div className="ttt-score">
                  <div className="ttt-score-label">Draws</div>
                  <div
                    className="ttt-score-value"
                    aria-label={`Draws: ${scoreboard.draws}`}
                  >
                    {scoreboard.draws}
                  </div>
                </div>
                <div className="ttt-score">
                  <div className="ttt-score-label">O Wins</div>
                  <div className="ttt-score-value" aria-label={`O wins: ${scoreboard.o}`}>
                    {scoreboard.o}
                  </div>
                </div>
              </div>

              <div className="ttt-controls" aria-label="Game mode">
                <button
                  type="button"
                  className={`ttt-chip ${mode === "pvp" ? "is-active" : ""}`}
                  onClick={() => handleModeChange("pvp")}
                  aria-label="Play versus player"
                  aria-pressed={mode === "pvp"}
                >
                  Vs Player
                </button>
                <button
                  type="button"
                  className={`ttt-chip ${mode === "ai" ? "is-active" : ""}`}
                  onClick={() => handleModeChange("ai")}
                  aria-label="Play versus computer"
                  aria-pressed={mode === "ai"}
                >
                  Vs Computer
                </button>
              </div>

              {isAiMode ? (
                <div className="ttt-controls" aria-label="AI difficulty">
                  <button
                    type="button"
                    className={`ttt-chip ${aiDifficulty === "easy" ? "is-active" : ""}`}
                    onClick={() => handleDifficultyChange("easy")}
                    aria-label="AI difficulty easy"
                    aria-pressed={aiDifficulty === "easy"}
                  >
                    Easy
                  </button>
                  <button
                    type="button"
                    className={`ttt-chip ${aiDifficulty === "medium" ? "is-active" : ""}`}
                    onClick={() => handleDifficultyChange("medium")}
                    aria-label="AI difficulty medium"
                    aria-pressed={aiDifficulty === "medium"}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    className={`ttt-chip ${aiDifficulty === "hard" ? "is-active" : ""}`}
                    onClick={() => handleDifficultyChange("hard")}
                    aria-label="AI difficulty hard"
                    aria-pressed={aiDifficulty === "hard"}
                  >
                    Hard
                  </button>
                </div>
              ) : null}

              <div className="ttt-controls" aria-label="Game controls">
                <button
                  type="button"
                  className="ttt-chip"
                  onClick={handleRestart}
                  aria-label="Restart game"
                >
                  Restart
                </button>
                <button
                  type="button"
                  className="ttt-chip"
                  onClick={handleResetScores}
                  aria-label="Reset scoreboard"
                >
                  Reset scores
                </button>
              </div>
            </section>
          </header>

          <div className="ttt-board" role="grid" aria-label="Game board" aria-busy={isComputerThinking}>
            {squares.map((value, i) => (
              <Square
                key={i}
                index={i}
                value={value}
                onClick={() => handleSquareClick(i)}
                disabled={boardLocked || value !== null}
                isWinning={Boolean(winningLine?.includes(i))}
              />
            ))}
          </div>

          <footer className="ttt-footer">
            <p className="ttt-hint">
              {isAiMode
                ? `Tip: You are X. The computer plays O. Difficulty: ${aiDifficulty}.`
                : "Tip: You can tab to squares and press Enter/Space to play."}
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
