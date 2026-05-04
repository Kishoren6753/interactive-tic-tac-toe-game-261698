import React, { useMemo, useState } from "react";
import "./App.css";

const BOARD_SIZE = 9;

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

// PUBLIC_INTERFACE
function App() {
  /**
   * squares: Array length 9: "X" | "O" | null
   * xIsNext: boolean toggles current player
   */
  const [squares, setSquares] = useState(() => Array(BOARD_SIZE).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const { winner, line: winningLine } = useMemo(
    () => calculateWinner(squares),
    [squares]
  );

  const isDraw = !winner && isBoardFull(squares);
  const gameOver = Boolean(winner) || isDraw;

  const statusText = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "Draw — no winner";
    return `Turn: ${xIsNext ? "X" : "O"}`;
  }, [winner, isDraw, xIsNext]);

  // PUBLIC_INTERFACE
  function handleSquareClick(i) {
    /**
     * Ignore clicks when:
     * - game finished
     * - square already set
     */
    if (gameOver || squares[i] !== null) return;

    const next = squares.slice();
    next[i] = xIsNext ? "X" : "O";

    setSquares(next);
    setXIsNext((v) => !v);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    /** Reset all state deterministically to initial values. */
    setSquares(Array(BOARD_SIZE).fill(null));
    setXIsNext(true);
  }

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
          </header>

          <div className="ttt-board" role="grid" aria-label="Game board">
            {squares.map((value, i) => (
              <Square
                key={i}
                index={i}
                value={value}
                onClick={() => handleSquareClick(i)}
                disabled={gameOver || value !== null}
                isWinning={Boolean(winningLine?.includes(i))}
              />
            ))}
          </div>

          <footer className="ttt-footer">
            <button
              type="button"
              className="ttt-btn"
              onClick={handleRestart}
              aria-label="Restart game"
            >
              Restart
            </button>

            <p className="ttt-hint">
              Tip: You can tab to squares and press Enter/Space to play.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
