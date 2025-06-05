/* eslint-env mocha */

import * as assert from "node:assert";
import { getInitialState, applyMove, checkWinner } from "../UltimateTTT.js";

describe("UltimateTTT API Spec", function () {
  it("Initial state should have X as current player", function () {
    var state = getInitialState();
    assert.strictEqual(state.currentPlayer, "X");
  });

  it("Should apply valid move and switch to O", function () {
    var state = getInitialState();
    var next = applyMove(state, { zone: [0, 0], cell: [1, 1] });

    assert.strictEqual(next.board[0][0][1][1], "X");
    assert.strictEqual(next.currentPlayer, "O");
  });

  it("Should reject move to already occupied cell", function () {
    var state = getInitialState();
    var afterFirst = applyMove(state, { zone: [0, 0], cell: [1, 1] });
    var afterSecond = applyMove(afterFirst, { zone: [0, 0], cell: [1, 1] });

    assert.deepStrictEqual(afterSecond, afterFirst);
  });

  it("Should recognize a winning line in small board", function () {
    var board = [
      ["X", "X", "X"],
      [null, null, null],
      [null, null, null]
    ];
    var winner = checkWinner(board);
    assert.strictEqual(winner, "X");
  });

  it("Should not detect winner in incomplete board", function () {
    var board = [
      ["X", "O", "X"],
      ["O", "X", null],
      ["O", null, null]
    ];
    var winner = checkWinner(board);
    assert.strictEqual(winner, null);
  });
});
