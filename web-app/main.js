import R from "./ramda.js";
import { getInitialState, applyMove } from "./UltimateTTT.js";

var state = getInitialState();

var boardElement = document.getElementById("board");
var titleElement = document.getElementById("title");
var statusElement = document.getElementById("status");

function render() {
  while (boardElement.firstChild) {
    boardElement.removeChild(boardElement.firstChild);
  }

  for (var zi = 0; zi < 3; zi++) {
    for (var zj = 0; zj < 3; zj++) {
      var zoneDiv = document.createElement("div");
      zoneDiv.className = "zone";

      for (var ci = 0; ci < 3; ci++) {
        for (var cj = 0; cj < 3; cj++) {
          var cellDiv = document.createElement("div");
          cellDiv.className = "cell";
          cellDiv.dataset.zi = zi;
          cellDiv.dataset.zj = zj;
          cellDiv.dataset.ci = ci;
          cellDiv.dataset.cj = cj;

          var mark = state.board[zi][zj][ci][cj];
          if (mark) {
            cellDiv.textContent = mark;
          }

          cellDiv.addEventListener("click", onCellClick);
          zoneDiv.appendChild(cellDiv);
        }
      }

      boardElement.appendChild(zoneDiv);
    }
  }

  titleElement.textContent = state.gameOver
    ? "Game Over - Winner: " + (state.winner || "Draw")
    : "Ultimate Tic Tac Toe";

  statusElement.textContent = state.gameOver
    ? ""
    : "Current Player: " + state.currentPlayer;
}

function onCellClick(event) {
  if (state.gameOver) {
    return;
  }

  var zi = Number(event.currentTarget.dataset.zi);
  var zj = Number(event.currentTarget.dataset.zj);
  var ci = Number(event.currentTarget.dataset.ci);
  var cj = Number(event.currentTarget.dataset.cj);

  if (state.nextZone !== null) {
    if (zi !== state.nextZone[0] || zj !== state.nextZone[1]) {
      return;
    }
  }

  state = applyMove(state, { zone: [zi, zj], cell: [ci, cj] });
  render();
}

window.addEventListener("load", function () {
  render();
});
