import { act } from "react-dom/test-utils";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

function clickSquareByLabel(label) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

test("renders initial UI and shows X to start", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /tic tac toe/i })).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Turn: X");
  expect(screen.getByRole("button", { name: /restart game/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reset scoreboard/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /play versus player/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /play versus computer/i })).toBeInTheDocument();

  // Board has 9 squares
  const allButtons = screen.getAllByRole("button");
  // 9 squares + (vs player, vs computer) + restart + reset scores
  expect(allButtons.length).toBe(13);
});

test("alternates turns and can produce a win for X in PvP mode", () => {
  render(<App />);

  // X: (0), O: (3), X: (1), O: (4), X: (2) => X wins top row
  clickSquareByLabel("Square Row 1, Col 1: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Turn: O");

  clickSquareByLabel("Square Row 2, Col 1: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Turn: X");

  clickSquareByLabel("Square Row 1, Col 2: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Turn: O");

  clickSquareByLabel("Square Row 2, Col 2: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Turn: X");

  clickSquareByLabel("Square Row 1, Col 3: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Winner: X");

  // After win, moves are locked: clicking an empty square shouldn't change winner/status
  clickSquareByLabel("Square Row 3, Col 3: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Winner: X");
});

test("restart resets the board and status", () => {
  render(<App />);

  clickSquareByLabel("Square Row 1, Col 1: empty");
  expect(screen.getByRole("status")).toHaveTextContent("Turn: O");

  fireEvent.click(screen.getByRole("button", { name: /restart game/i }));

  expect(screen.getByRole("status")).toHaveTextContent("Turn: X");
  // Ensure the square is empty again (by aria label)
  expect(
    screen.getByRole("button", { name: "Square Row 1, Col 1: empty" })
  ).toBeInTheDocument();
});

test("AI mode: after the player moves, the computer makes a move automatically", () => {
  jest.useFakeTimers();

  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: /play versus computer/i }));
  expect(screen.getByRole("status")).toHaveTextContent("Turn: X");

  // Player (X) plays top-left
  clickSquareByLabel("Square Row 1, Col 1: empty");

  // AI should think, then place O (usually center); we don't assert exact square,
  // just that an O appears after timers run.
  act(() => {
    jest.advanceTimersByTime(300);
  });

  // There should be at least one square labeled with O now.
  const oSquares = screen.queryAllByRole("button", { name: /: O$/i });
  expect(oSquares.length).toBeGreaterThanOrEqual(1);

  jest.useRealTimers();
});
