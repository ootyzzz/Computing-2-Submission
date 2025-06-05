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
 function empty3x3() {
   return Array.from({ length: 3 }, function () {
     return Array(3).fill(null);
   });
 }

 return Object.freeze({
   board: Array.from({ length: 3 }, function () {
     return Array.from({ length: 3 }, function () {
       return empty3x3();
     });
   }),
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
 var zone = move.zone;
 var cell = move.cell;

 if (state.gameOver) {
   return state;
 }

 var newState = structuredClone(state);
 var zi = zone[0];
 var zj = zone[1];
 var ci = cell[0];
 var cj = cell[1];

 if (newState.board[zi][zj][ci][cj]) {
   return state;
 }

 newState.board[zi][zj][ci][cj] = newState.currentPlayer;

 if (!newState.zoneWinners[zi][zj]) {
   var winner = checkWinner(newState.board[zi][zj]);
   if (winner) {
     newState.zoneWinners[zi][zj] = winner;
   }
 }

 var gameWinner = checkWinner(newState.zoneWinners);
 if (gameWinner) {
   newState.gameOver = true;
   newState.winner = gameWinner;
 }

 var nextZi = ci;
 var nextZj = cj;
 if (newState.zoneWinners[nextZi][nextZj]) {
   newState.nextZone = null;
 } else {
   newState.nextZone = [nextZi, nextZj];
 }

 newState.currentPlayer = newState.currentPlayer === "X" ? "O" : "X";

 return newState;
}

/**
* Check winner of a 3x3 board
* @param {Player[][]} board
* @returns {Player|null}
*/
export function checkWinner(board) {
 var lines = [];

 for (var i = 0; i < 3; i++) {
   lines.push(board[i]);
   lines.push([board[0][i], board[1][i], board[2][i]]);
 }

 lines.push([board[0][0], board[1][1], board[2][2]]);
 lines.push([board[0][2], board[1][1], board[2][0]]);

 for (var j = 0; j < lines.length; j++) {
   var line = lines[j];
   if (line[0] && line[0] === line[1] && line[1] === line[2]) {
     return line[0];
   }
 }

 return null;
}
