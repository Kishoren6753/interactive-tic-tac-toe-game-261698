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

  // Board has 9 squares
  const allButtons = screen.getAllByRole("button");
  // 9 squares + restart
  expect(allButtons.length).toBe(10);
});

test("alternates turns and can produce a win for X", () => {
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
