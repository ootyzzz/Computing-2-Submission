/* eslint-env mocha */

import * as assert from "node:assert";
import {
  getInitialState,
  applyMove,
  checkWinner,
  isZoneFull,
  isDraw
} from "../UltimateTTT.js";

describe("UltimateTTT API", function () {
  it("Initial state is empty and valid", function () {
    const state = getInitialState();
    assert.strictEqual(state.currentPlayer, "X");
    assert.strictEqual(state.gameOver, false);
    assert.strictEqual(state.winner, null);
    assert.strictEqual(state.nextZone, null);
    assert.strictEqual(state.board.length, 3);
    assert.strictEqual(state.zoneWinners.length, 3);
  });

  it("Apply a valid move updates the board and switches player", function () {
    let state = getInitialState();
    state = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    assert.strictEqual(state.board[0][0][1][1], "X");
    assert.strictEqual(state.currentPlayer, "O");
    assert.deepStrictEqual(state.nextZone, [1, 1]);
  });

  it("Cannot move in a locked zone", function () {
    let state = getInitialState();
    state = applyMove(state, { zone: [0, 0], cell: [0, 0] });
    // Simulate zone locked
    state.zoneWinners = [["X", null, null], [null, null, null], [null, null, null]];
    const next = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    assert.deepStrictEqual(next, state);
  });

  it("Cannot move in an occupied cell", function () {
    let state = getInitialState();
    state = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    const next = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    assert.deepStrictEqual(next, state);
  });

  it("Detects small board winner", function () {
    // X wins top-left zone
    let board = [
      [
        [
          ["X", "X", "X"],
          [null, null, null],
          [null, null, null]
        ],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ]
    ];
    assert.strictEqual(checkWinner(board[0][0]), "X");
  });

  it("Detects global winner", function () {
    // X wins global by top row
    const zoneWinners = [
      ["X", "X", "X"],
      [null, null, null],
      [null, null, null]
    ];
    assert.strictEqual(checkWinner(zoneWinners), "X");
  });

  it("Detects draw when all zones are full and no winner", function () {
    const zoneWinners = [
      ["X", "O", "X"],
      ["O", "X", "O"],
      ["O", "X", "O"]
    ];
    const board = Array.from({ length: 3 }, (_, zi) =>
      Array.from({ length: 3 }, (_, zj) =>
        Array.from({ length: 3 }, () => Array(3).fill("X"))
      )
    );
    assert.strictEqual(isDraw(zoneWinners, board), true);
  });

  it("isZoneFull returns true for full zone", function () {
    const board = [
      [
        [
          ["X", "O", "X"],
          ["O", "X", "O"],
          ["O", "X", "O"]
        ],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ]
    ];
    const zoneWinners = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    assert.strictEqual(isZoneFull(board, zoneWinners, 0, 0), true);
    assert.strictEqual(isZoneFull(board, zoneWinners, 1, 1), false);
  });

  it("isZoneFull returns true for locked zone", function () {
    const board = [
      [
        [
          ["X", "O", "X"],
          ["O", "X", "O"],
          ["O", "X", "O"]
        ],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ],
      [
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]],
        [[null, null, null], [null, null, null], [null, null, null]]
      ]
    ];
    const zoneWinners = [
      ["X", null, null],
      [null, null, null],
      [null, null, null]
    ];
    assert.strictEqual(isZoneFull(board, zoneWinners, 0, 0), true);
  });

  it("applyMove returns same state for illegal move", function () {
    let state = getInitialState();
    state = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    // Try to move again in the same cell
    const next = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    assert.deepStrictEqual(next, state);
  });

  it("applyMove returns same state for move in locked zone", function () {
    let state = getInitialState();
    state.zoneWinners = [["X", null, null], [null, null, null], [null, null, null]];
    const next = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    assert.deepStrictEqual(next, state);
  });

  it("applyMove switches player and updates nextZone", function () {
    let state = getInitialState();
    state = applyMove(state, { zone: [0, 0], cell: [2, 2] });
    assert.strictEqual(state.currentPlayer, "O");
    assert.deepStrictEqual(state.nextZone, [2, 2]);
  });
});
