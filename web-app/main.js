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
const aiBrainBar = document.getElementById("aiBrainBar");

let aiEnabled = false;
let aiThinkingTimeout = null;
let lastMove = null;
let aiThinkingStart = null;

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
  // Check if the target zone is restricted
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
  // All zones are locked/full and there is no winner
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

      // Only non-locked zones are grayed out
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

      // Highlight the 3 winning zones after game over
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
          // Highlight the last move
          if (
            lastMove &&
            lastMove.zone[0] === i &&
            lastMove.zone[1] === j &&
            lastMove.cell[0] === m &&
            lastMove.cell[1] === n
          ) {
            cellDiv.classList.add("cell-last");
          }

          // Add .disabled to cells that cannot be played
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
            // Show move preview on hover
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

/**
 * AI implementation (custom, not in Freddie Page's original):
 * Uses minimax search with depth parameter.
 * Depth is determined by the Elo ratio (X Elo / O Elo):
 *   - 0 < ratio ≤ 1: depth = 3
 *   - 1 < ratio ≤ 2: depth = 4
 *   - ratio > 2:     depth = 5
 * The ratio is computed via Stats.get_elo_ratio().
 * The search is not optimal but follows standard minimax with simple evaluation.
 */

function evaluateState(state) {
  // Simple evaluation: +100 for O win, -100 for X win, else 0
  if (state.winner === "O") return 100;
  if (state.winner === "X") return -100;
  // Heuristic: count O's zones - X's zones
  let oCount = 0, xCount = 0;
  for (let i = 0; i < 3; ++i) for (let j = 0; j < 3; ++j) {
    if (state.zoneWinners[i][j] === "O") oCount++;
    if (state.zoneWinners[i][j] === "X") xCount++;
  }
  return (oCount - xCount) * 10;
}

function getAIDepth() {
  // Custom: use Stats.get_elo_ratio() to determine depth
  const ratio = Stats.get_elo_ratio();
  if (ratio <= 1) return 4;
  if (ratio <= 2) return 5;
  return 6;
}

function minimax(state, depth, maximizingPlayer) {
  if (depth === 0 || state.gameOver) {
    return { score: evaluateState(state) };
  }
  const moves = getAvailableMoves(state);
  if (moves.length === 0) {
    return { score: evaluateState(state) };
  }
  let bestMove = null;
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const evalResult = minimax(nextState, depth - 1, false);
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const evalResult = minimax(nextState, depth - 1, true);
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }
    }
    return { score: minEval, move: bestMove };
  }
}

function simpleAIMove(state) {
  // Use minimax with depth determined by Elo ratio
  const depth = getAIDepth();
  const result = minimax(state, depth, true);
  if (result && result.move) {
    return result.move;
  }
  // Fallback: random
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function showAIBubble(show, hard = false) {
  if (aiBubble) {
    aiBubble.style.display = show ? "flex" : "none";
    aiBubble.textContent = show ? (hard ? "thinking hard..." : "thinking...") : "";
    aiBubble.classList.toggle("ai-bubble-hard", !!hard);
  }
}

function updateAIBrainBar() {
  if (!aiBrainBar) return;
  const depth = getAIDepth();
  let level = 1;
  if (depth === 4) level = 1;
  else if (depth === 5) level = 2;
  else level = 3;
  aiBrainBar.innerHTML = `
    <div class="ai-brain-label">AI Brain</div>
    <div class="ai-brain-bar-bg">
      <div class="ai-brain-bar-fill" style="width:${level * 33.33}%;"></div>
    </div>
    <div class="ai-brain-levels">
      <span${level === 1 ? ' class="active"' : ''}>Low</span>
      <span${level === 2 ? ' class="active"' : ''}>Med</span>
      <span${level === 3 ? ' class="active"' : ''}>High</span>
    </div>
  `;
}

function maybeTriggerAI() {
  if (
    aiEnabled &&
    !state.gameOver &&
    state.currentPlayer === "O"
  ) {
    aiThinkingStart = Date.now();
    showAIBubble(true, false);
    if (aiThinkingTimeout) {
      clearTimeout(aiThinkingTimeout);
    }
    // After 4s, if still thinking, show "thinking hard..."
    aiThinkingTimeout = setTimeout(() => {
      showAIBubble(true, true);
    }, 5000);
    // After 5s (AI move), hide bubble and move
    aiThinkingTimeout = setTimeout(() => {
      showAIBubble(false, false);
      const move = simpleAIMove(state);
      if (move) {
        onCellClick({ currentTarget: { dataset: {
          zi: move.zone[0], zj: move.zone[1], ci: move.cell[0], cj: move.cell[1]
        } } });
      }
    }, 6000);
  } else {
    showAIBubble(false, false);
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
  updateAIBrainBar();

  // Button enable/disable state
  if (undoBtn) undoBtn.disabled = history.length <= 1;
  if (randomBtn) randomBtn.disabled = !!state.gameOver;
  if (resetBtn) resetBtn.disabled = false; // New Game is always enabled

  maybeTriggerAI();
}

function onCellClick(event) {
  if (state.gameOver) return;
  const zi = Number(event.currentTarget.dataset.zi);
  const zj = Number(event.currentTarget.dataset.zj);
  const ci = Number(event.currentTarget.dataset.ci);
  const cj = Number(event.currentTarget.dataset.cj);

  // Check if the target zone is restricted
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
    lastMove = { zone: [zi, zj], cell: [ci, cj] }; // Record the last move

    // Save stats history if game is over
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
      // If undoing a finished game, also undo stats
      if (history[history.length - 1].gameOver && statsHistory.length > 0) {
        // Restore previous Elo/stats
        const prevStats = statsHistory.pop();
        if (prevStats) {
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
    lastMove = null; // Clear last move
    render();
  };
}

if (aiToggle) {
  aiToggle.addEventListener("change", function () {
    aiEnabled = aiToggle.checked;
    updateAIBrainBar();
    maybeTriggerAI();
  });
}

// Guide modal logic
const guideModal = document.createElement("div");
guideModal.id = "guideModal";
guideModal.innerHTML = `
  <div class="guide-modal-content">
    <button id="closeGuideBtn" class="guide-close-btn">&times;</button>
    <h2>Welcome to Ultimate Tic-Tac-Toe!</h2>
    <ul>
      <li>Click a cell to make your move. Each move determines the next zone for your opponent.</li>
      <li>Win a small board to claim that zone. Win three zones in a row to win the game!</li>
      <li>Enable <b>AI</b> on the right to play against the computer. The AI "brain" bar shows its strength.</li>
      <li>Use <b>Undo</b>, <b>Random Move</b>, or <b>New Game</b> at any time.</li>
      <li>Player stats and Elo are tracked on both sides.</li>
      <li>Click the <b>?</b> button in the lower left for help at any time.</li>
    </ul>
    <div style="text-align:center;margin-top:1.5em;">
      <button id="closeGuideBtn2" class="guide-ok-btn">OK</button>
    </div>
  </div>
`;
document.body.appendChild(guideModal);

function showGuideModal(show) {
  guideModal.style.display = show ? "flex" : "none";
}
function setupGuideModal() {
  guideModal.style.display = "flex";
  document.getElementById("closeGuideBtn").onclick = () => showGuideModal(false);
  document.getElementById("closeGuideBtn2").onclick = () => showGuideModal(false);
}
setupGuideModal();

// Floating help button
const helpBtn = document.createElement("button");
helpBtn.id = "helpBtn";
helpBtn.title = "Show Guide";
helpBtn.innerHTML = "?";
document.body.appendChild(helpBtn);
helpBtn.onclick = () => showGuideModal(true);

window.addEventListener("load", function() {
  if (aiToggle) {
    aiToggle.checked = false;
    aiEnabled = false;
  }
  updateAIBrainBar();
  render();
  // Show guide only on first load
  showGuideModal(true);
});
window.addEventListener("load", render);
