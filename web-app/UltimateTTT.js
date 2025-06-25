import R from "./ramda.js";

/**
 * Ultimate Tic-Tac-Toe Game API
 * Functional game state manipulation and validation
 * @module UltimateTTT
 */

/**
 * @typedef {"X"|"O"|null} Player
 * @typedef {Player[][]} SmallBoard 3x3 small board
 * @typedef {SmallBoard[][]} BigBoard 3x3 grid of 3x3 boards
 * @typedef {{
 *   board: BigBoard,
 *   currentPlayer: Player,
 *   nextZone: [number, number]|null,
 *   zoneWinners: Player[][],
 *   gameOver: boolean,
 *   winner: Player|null
 * }} GameState
 */

/**
 * Create initial empty game state.
 * @returns {GameState}
 */
export function getInitialState() {
  const empty3x3 = () => R.times(() => R.repeat(null, 3), 3);
  return Object.freeze({
    board: R.times(() => R.times(() => empty3x3(), 3), 3),
    currentPlayer: "X",
    nextZone: null,
    zoneWinners: empty3x3(),
    gameOver: false,
    winner: null
  });
}

/**
 * Apply a move to the current game state.
 * @param {GameState} state
 * @param {{zone: [number, number], cell: [number, number]}} move
 * @returns {GameState}
 */
export function applyMove(state, move) {
  if (state.gameOver) {
    return state;
  }
  const [zi, zj] = move.zone;
  const [ci, cj] = move.cell;
  if (R.path([zi, zj], state.zoneWinners)) {
    return state;
  }
  if (R.path([zi, zj, ci, cj], state.board)) {
    return state;
  }
  const newBoard = R.assocPath([zi, zj, ci, cj], state.currentPlayer, state.board);
  const zoneWinner = R.path([zi, zj], state.zoneWinners) || checkWinner(newBoard[zi][zj]);
  const newZoneWinners = R.assocPath([zi, zj], zoneWinner || null, state.zoneWinners);
  const gameWinner = checkWinner(newZoneWinners);
  const nextZi = ci;
  const nextZj = cj;
  const nextZone = R.path([nextZi, nextZj], newZoneWinners) ? null : [nextZi, nextZj];
  return {
    board: newBoard,
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
    nextZone: nextZone,
    zoneWinners: newZoneWinners,
    gameOver: Boolean(gameWinner),
    winner: gameWinner || null
  };
}

/**
 * Check winner of a 3x3 board.
 * @param {Player[][]} board
 * @returns {Player|null}
 */
export function checkWinner(board) {
  const rows = board;
  const cols = R.transpose(board);
  const diag1 = [board[0][0], board[1][1], board[2][2]];
  const diag2 = [board[0][2], board[1][1], board[2][0]];
  const lines = R.concat(R.concat(rows, cols), [diag1, diag2]);
  const winner = R.find(
    line => line[0] && R.all(R.equals(line[0]), line),
    lines
  );
  return winner ? winner[0] : null;
}

/**
 * Check if a small board is full (no empty cells).
 * @param {BigBoard} board
 * @param {Player[][]} zoneWinners
 * @param {number} zi
 * @param {number} zj
 * @returns {boolean}
 */
export function isZoneFull(board, zoneWinners, zi, zj) {
  return R.path([zi, zj], zoneWinners) ||
    R.all(row => R.all(cell => cell !== null, row), board[zi][zj]);
}

/**
 * Check if the game is a draw (all zones locked/full and no winner).
 * @param {Player[][]} zoneWinners
 * @param {BigBoard} board
 * @returns {boolean}
 */
export function isDraw(zoneWinners, board) {
  // If all zones are either won or full, and there is no winner, it's a draw
  const allZonesFullOrLocked = R.all(
    (row, zi) => R.all(
      (winner, zj) =>
        winner || R.all(
          r => R.all(cell => cell !== null, r),
          board[zi][zj]
        ),
      row
    ),
    zoneWinners
  );
  return allZonesFullOrLocked && !checkWinner(zoneWinners);
}