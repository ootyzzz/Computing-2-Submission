import R from "./ramda.js";

/**
 * Ultimate Tic-Tac-Toe Game API
 * Functional game state manipulation and validation
 */

/**
 * @typedef {("X"|"O"|null)} Player
 * @typedef {Player[][]} SmallBoard 3x3 small board
 * @typedef {SmallBoard[]} BigBoard 3x3 grid of 3x3 boards
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
* Create initial empty game state
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
* Apply a move to the current game state
* @param {GameState} state
* @param {{zone: [number, number], cell: [number, number]}} move
* @returns {GameState}
*/
export function applyMove(state, move) {
  if (state.gameOver) return state;

  const [zi, zj] = move.zone;
  const [ci, cj] = move.cell;

  // 禁止在已锁定小棋盘落子
  if (state.zoneWinners[zi][zj]) return state;

  // If cell is occupied, return state
  if (R.path([zi, zj, ci, cj], state.board)) return state;

  // Place mark
  const newBoard = R.over(
    R.lensPath([zi, zj, ci, cj]),
    R.always(state.currentPlayer),
    state.board
  );

  // Check if small board is won
  const zoneWinner = state.zoneWinners[zi][zj]
    ? state.zoneWinners[zi][zj]
    : checkWinner(newBoard[zi][zj]);

  const newZoneWinners = R.assocPath(
    [zi, zj],
    zoneWinner || null,
    state.zoneWinners
  );

  // Check if game is won
  const gameWinner = checkWinner(newZoneWinners);

  // Next zone logic
  const nextZi = ci, nextZj = cj;
  const nextZone =
    newZoneWinners[nextZi][nextZj] ? null : [nextZi, nextZj];

  return {
    board: newBoard,
    currentPlayer: state.currentPlayer === "X" ? "O" : "X",
    nextZone,
    zoneWinners: newZoneWinners,
    gameOver: Boolean(gameWinner),
    winner: gameWinner || null
  };
}

/**
* Check winner of a 3x3 board
* @param {Player[][]} board
* @returns {Player|null}
*/
export function checkWinner(board) {
  // All lines: rows, columns, diagonals
  const rows = board;
  const cols = R.transpose(board);
  const diag1 = [board[0][0], board[1][1], board[2][2]];
  const diag2 = [board[0][2], board[1][1], board[2][0]];
  const lines = R.concat(R.concat(rows, cols), [diag1, diag2]);

  // Find a line where all three are equal and not null
  const winner = R.find(
    line => line[0] && R.all(R.equals(line[0]), line),
    lines
  );
  return winner ? winner[0] : null;
}
