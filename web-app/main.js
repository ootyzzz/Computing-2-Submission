import R from "./ramda.js";
import { getInitialState, applyMove, checkWinner } from "./UltimateTTT.js";
import Stats from "./Stats.js";

let state = getInitialState();
let history = [state];
let statsHistory = [];

const boardElement = document.getElementById("board");
const titleElement = document.getElementById("title");
const statusElement = document.getElementById("status");
const playerXStats = document.getElementById("playerXStats");
const playerOStats = document.getElementById("playerOStats");

const undoBtn = document.getElementById("undoBtn");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");
const aiToggle = document.getElementById("aiToggle");
const aiBubble = document.getElementById("aiBubble");

let aiEnabled = false;
let aiThinkingTimeout = null;
let lastMove = null;

function getWinLine(zoneWinners, winner) {
  const lines = [
    [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
  ];
  for (const line of lines) {
    if (line.every(([i,j]) => zoneWinners[i][j] === winner)) return line;
  }
  return null;
}

function isZoneFull(board, zoneWinner, zi, zj) {
  if (zoneWinner) return true;
  for (let ci = 0; ci < 3; ci++) {
    for (let cj = 0; cj < 3; cj++) {
      if (!board[zi][zj][ci][cj]) return false;
    }
  }
  return true;
}

function getAvailableMoves(state) {
  const moves = [];
  // 判断目标zone是否可下
  let restrictToZone = false;
  if (state.nextZone) {
    const [zi, zj] = state.nextZone;
    if (!isZoneFull(state.board, state.zoneWinners[zi][zj], zi, zj)) {
      restrictToZone = true;
    }
  }
  for (let zi = 0; zi < 3; zi++) {
    for (let zj = 0; zj < 3; zj++) {
      if (state.zoneWinners[zi][zj]) continue;
      if (restrictToZone && (zi !== state.nextZone[0] || zj !== state.nextZone[1])) continue;
      for (let ci = 0; ci < 3; ci++) {
        for (let cj = 0; cj < 3; cj++) {
          if (!state.board[zi][zj][ci][cj]) {
            moves.push({ zone: [zi, zj], cell: [ci, cj] });
          }
        }
      }
    }
  }
  return moves;
}

function isDraw(zoneWinners, board) {
  // 所有zone都被锁定且没有winner
  for (let i = 0; i < 3; ++i) for (let j = 0; j < 3; ++j)
    if (!zoneWinners[i][j] && !isZoneFull(board, zoneWinners[i][j], i, j)) return false;
  return !checkWinner(zoneWinners);
}

function renderBoard(board, zoneWinners, nextZone, winLine) {
  boardElement.innerHTML = "";
  const boardRect = boardElement.getBoundingClientRect();
  const zoneSize = boardRect.width / 3;

  R.addIndex(R.forEach)((zi, i) => {
    R.addIndex(R.forEach)((zj, j) => {
      const zoneDiv = document.createElement("div");
      zoneDiv.className = "zone";
      zoneDiv.style.position = "relative";
      if (zoneWinners[i][j] === "X") zoneDiv.classList.add("locked-x");
      if (zoneWinners[i][j] === "O") zoneDiv.classList.add("locked-o");

      // 只对未锁定zone变灰
      let restrictToZone = false;
      if (nextZone) {
        const [nzi, nzj] = nextZone;
        if (!isZoneFull(board, zoneWinners[nzi][nzj], nzi, nzj)) {
          restrictToZone = true;
        }
        if (
          restrictToZone &&
          (i !== nextZone[0] || j !== nextZone[1]) &&
          !zoneWinners[i][j]
        ) {
          zoneDiv.style.opacity = "0.5";
        }
      }

      // winner后3个zone突出且色块更淡
      if (winLine && winLine.some(([x, y]) => x === i && y === j)) {
        zoneDiv.classList.add("win-animate");
        zoneDiv.addEventListener("animationend", () => {
          zoneDiv.classList.remove("win-animate");
        }, { once: true });
      }

      if (zoneWinners[i][j]) {
        const mask = document.createElement("div");
        mask.className = "zone-mask";
        mask.style.position = "absolute";
        mask.style.left = 0;
        mask.style.top = 0;
        mask.style.width = "100%";
        mask.style.height = "100%";
        mask.style.background = zoneWinners[i][j] === "X" ? "#c0395a" : "#1abc9c";
        mask.style.opacity = "0.85";
        mask.style.zIndex = 2;
        zoneDiv.appendChild(mask);

        const bigMark = document.createElement("div");
        bigMark.className = "big-mark";
        bigMark.textContent = zoneWinners[i][j];
        bigMark.style.fontSize = `${zoneSize * 0.7}px`;
        bigMark.style.position = "absolute";
        bigMark.style.left = 0;
        bigMark.style.top = 0;
        bigMark.style.width = "100%";
        bigMark.style.height = "100%";
        bigMark.style.display = "flex";
        bigMark.style.alignItems = "center";
        bigMark.style.justifyContent = "center";
        bigMark.style.color = "white";
        bigMark.style.fontWeight = "bold";
        bigMark.style.zIndex = 3;
        zoneDiv.appendChild(bigMark);
      }

      R.addIndex(R.forEach)((ci, m) => {
        R.addIndex(R.forEach)((cj, n) => {
          const cellDiv = document.createElement("div");
          cellDiv.className = "cell";
          cellDiv.dataset.zi = i;
          cellDiv.dataset.zj = j;
          cellDiv.dataset.ci = m;
          cellDiv.dataset.cj = n;
          const mark = board[i][j][m][n];
          if (mark) {
            cellDiv.textContent = mark;
            cellDiv.classList.add(mark === "X" ? "cell-x" : "cell-o");
          }
          // 高亮最新落子
          if (
            lastMove &&
            lastMove.zone[0] === i &&
            lastMove.zone[1] === j &&
            lastMove.cell[0] === m &&
            lastMove.cell[1] === n
          ) {
            cellDiv.classList.add("cell-last");
          }

          // 禁止落子的cell加.disabled
          let restrict = false;
          if (zoneWinners[i][j]) restrict = true;
          else if (nextZone) {
            const [nzi, nzj] = nextZone;
            if (!isZoneFull(board, zoneWinners[nzi][nzj], nzi, nzj)) {
              if (i !== nextZone[0] || j !== nextZone[1]) restrict = true;
            }
          }
          if (restrict) {
            cellDiv.classList.add("disabled");
          } else {
            // 落子预览
            cellDiv.addEventListener("mouseenter", function () {
              if (!cellDiv.textContent) {
                const preview = document.createElement("div");
                preview.className = "cell-preview " +
                  (state.currentPlayer === "X" ? "cell-preview-x" : "cell-preview-o");
                preview.textContent = state.currentPlayer;
                cellDiv.appendChild(preview);
              }
            });
            cellDiv.addEventListener("mouseleave", function () {
              const preview = cellDiv.querySelector(".cell-preview");
              if (preview) cellDiv.removeChild(preview);
            });
            cellDiv.addEventListener("click", onCellClick);
          }
          zoneDiv.appendChild(cellDiv);
        })(R.range(0, 3));
      })(R.range(0, 3));
      boardElement.appendChild(zoneDiv);
    })(R.range(0, 3));
  })(R.range(0, 3));
}

function renderStats() {
  const stats = Stats.get_statistics(["X", "O"]);
  playerXStats.innerHTML = `
    <div><b>Elo:</b> ${Math.round(stats.X.elo)}</div>
    <div><b>Wins:</b> ${stats.X.player_1_wins + stats.X.player_2_wins}</div>
    <div><b>Losses:</b> ${stats.X.player_1_losses + stats.X.player_2_losses}</div>
    <div><b>Draws:</b> ${stats.X.player_1_draws + stats.X.player_2_draws}</div>
  `;
  playerOStats.innerHTML = `
    <div><b>Elo:</b> ${Math.round(stats.O.elo)}</div>
    <div><b>Wins:</b> ${stats.O.player_1_wins + stats.O.player_2_wins}</div>
    <div><b>Losses:</b> ${stats.O.player_1_losses + stats.O.player_2_losses}</div>
    <div><b>Draws:</b> ${stats.O.player_1_draws + stats.O.player_2_draws}</div>
  `;
}

function simpleAIMove(state) {
  // Pick random available move (can be improved)
  const moves = getAvailableMoves(state);
  if (moves.length === 0) {
    return null;
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function showAIBubble(show) {
  if (aiBubble) {
    aiBubble.style.display = show ? "flex" : "none";
    aiBubble.textContent = show ? "thinking..." : "";
  }
}

function maybeTriggerAI() {
  if (
    aiEnabled &&
    !state.gameOver &&
    state.currentPlayer === "O"
  ) {
    showAIBubble(true);
    if (aiThinkingTimeout) {
      clearTimeout(aiThinkingTimeout);
    }
    aiThinkingTimeout = setTimeout(() => {
      showAIBubble(false);
      const move = simpleAIMove(state);
      if (move) {
        onCellClick({ currentTarget: { dataset: {
          zi: move.zone[0], zj: move.zone[1], ci: move.cell[0], cj: move.cell[1]
        }}});
      }
    }, 3000);
  } else {
    showAIBubble(false);
    if (aiThinkingTimeout) {
      clearTimeout(aiThinkingTimeout);
      aiThinkingTimeout = null;
    }
  }
}

function render() {
  let winLine = null;
  if (state.gameOver && state.winner) {
    winLine = getWinLine(state.zoneWinners, state.winner);
  }
  renderBoard(state.board, state.zoneWinners, state.nextZone, winLine);

  if (state.gameOver && state.winner) {
    titleElement.innerHTML = `<div class="winner-banner">Game Over - Winner: <span>${state.winner}</span></div>`;
  } else if (state.gameOver) {
    titleElement.innerHTML = `<div class="winner-banner">Game Over - Draw</div>`;
  } else {
    titleElement.innerHTML = "";
  }
  // Current player with icon
  if (!state.gameOver) {
    statusElement.innerHTML = `Current Player: <span class="status-icon-${state.currentPlayer.toLowerCase()}">${state.currentPlayer}</span>`;
  } else {
    statusElement.innerHTML = "";
  }
  renderStats();

  // 按钮可用性
  if (undoBtn) undoBtn.disabled = history.length <= 1;
  if (randomBtn) randomBtn.disabled = !!state.gameOver;
  if (resetBtn) resetBtn.disabled = false; // New Game永远可用

  maybeTriggerAI();
}

function onCellClick(event) {
  if (state.gameOver) return;
  const zi = Number(event.currentTarget.dataset.zi);
  const zj = Number(event.currentTarget.dataset.zj);
  const ci = Number(event.currentTarget.dataset.ci);
  const cj = Number(event.currentTarget.dataset.cj);

  // 判断目标zone是否可下
  let restrictToZone = false;
  if (state.nextZone) {
    const [nzi, nzj] = state.nextZone;
    if (!isZoneFull(state.board, state.zoneWinners[nzi][nzj], nzi, nzj)) {
      restrictToZone = true;
    }
  }
  if (restrictToZone && (zi !== state.nextZone[0] || zj !== state.nextZone[1])) return;

  const next = applyMove(state, { zone: [zi, zj], cell: [ci, cj] });
  if (next !== state) {
    state = next;
    history = R.append(state, history);
    lastMove = { zone: [zi, zj], cell: [ci, cj] }; // 记录最新落子

    // 记录stats历史
    if (state.gameOver) {
      statsHistory.push({
        x: Stats.get_statistics(["X"])[ "X" ],
        o: Stats.get_statistics(["O"])[ "O" ]
      });
      if (state.winner) {
        Stats.record_game("X", "O", state.winner === "X" ? 1 : 2);
      } else {
        Stats.record_game("X", "O", 0);
      }
    }
    render();
  }
}

if (undoBtn) {
  undoBtn.onclick = function () {
    if (history.length > 1) {
      // 如果撤回的是一个终局，撤回stats
      if (history[history.length - 1].gameOver && statsHistory.length > 0) {
        // 恢复上一次的 Elo/stats
        const prevStats = statsHistory.pop();
        if (prevStats) {
          // 直接覆盖 Stats 模块的 player_statistics
          Object.assign(Stats.get_statistics(["X"])[ "X" ], prevStats.x);
          Object.assign(Stats.get_statistics(["O"])[ "O" ], prevStats.o);
        }
      }
      history = history.slice(0, -1);
      state = history[history.length - 1];
      render();
    }
  };
}

if (randomBtn) {
  randomBtn.onclick = function () {
    if (state.gameOver) return;
    const moves = getAvailableMoves(state);
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      onCellClick({ currentTarget: { dataset: {
        zi: move.zone[0], zj: move.zone[1], ci: move.cell[0], cj: move.cell[1]
      }}});
    }
  };
}

if (resetBtn) {
  resetBtn.onclick = function () {
    state = getInitialState();
    history = [state];
    statsHistory = [];
    lastMove = null; // 清除最新落子
    render();
  };
}

if (aiToggle) {
  aiToggle.addEventListener("change", function () {
    aiEnabled = aiToggle.checked;
    maybeTriggerAI();
  });
}

window.addEventListener("load", render);
