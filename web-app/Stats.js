/**
 * Stats is a module to load and save game stats and Elo ratings
 * for Ultimate Tic Tac Toe games.
 * @namespace Stats
 * @author Feifan Xia (adapted from the original by Freddie Page)
 * @version 2025-06-10
 */
const Stats = Object.create(null);

/**
 * @memberof Stats
 * @typedef {Object} Statistics
 * @property {number} elo The Elo score of the player.
 * {@link https://en.wikipedia.org/wiki/Elo_rating_system}
 * @property {number} player_1_wins How many times the player
 * has won when playing first.
 * @property {number} player_1_losses How many times the player has
 *     lost when playing first.
 * @property {number} player_1_draws How many times the player has
 *     tied when playing first.
 * @property {number} player_2_wins How many times the player has
 *     won when playing second.
 * @property {number} player_2_losses How many times the player has
 *     lost when playing second.
 * @property {number} player_2_draws How many times the player has
 *     tied when playing second.
 * @property {number} current_streak The number of games the player has won
 *     since last losing (or ever if the player has never lost).
 * @property {number} longest_streak The most consecutive games won.
 */

const player_statistics = {};

const new_player = function () {
    return {
        "current_streak": 0,
        "elo": 100,
        "longest_streak": 0,
        "player_1_draws": 0,
        "player_1_losses": 0,
        "player_1_wins": 0,
        "player_2_draws": 0,
        "player_2_losses": 0,
        "player_2_wins": 0
    };
};

/**
 * @memberof Stats
 * @function
 * @param {string[]} players A list of player names to return stats for.
 * @returns {Object.<Stats.Statistics>} The statistics of the requested
 *     players as object with keys given in players.
 */
Stats.get_statistics = function (players) {
    return Object.fromEntries(
        players.map(
            (player) => [player, player_statistics[player] || new_player()]
        )
    );
};

const elo = function (elo_updating, elo_opponent, result) {
    const k_factor = 40;
    const expected = 1 / (1 + 10 ** ((elo_opponent - elo_updating) / 400));
    return elo_updating + k_factor * (result - expected);
};

/**
 * Record the result of a game and return updated statistcs.
 * @memberof Stats
 * @function
 * @param {string} player_1 The name of player 1 (who plies first)
 * @param {string} player_2 The name of player 2
 * @param {(0 | 1 | 2)} result The number of the player who won,
 *     or `0` for a draw.
 * @returns {Object.<Stats.Statistics>} Returns statistics for player_1 and
 *     player_2, i.e. the result of
 *     {@link Stats.get_statistics}`([player_1, player_2])`
 */
Stats.record_game = function (player_1, player_2, result) {
    if (!player_statistics[player_1]) {
        player_statistics[player_1] = new_player();
    }
    if (!player_statistics[player_2]) {
        player_statistics[player_2] = new_player();
    }
    const player_1_stats = player_statistics[player_1];
    const player_2_stats = player_statistics[player_2];
    let player_1_result;
    let player_2_result;
    switch (result) {
    case (0):
        player_1_stats.player_1_draws += 1;
        player_2_stats.player_2_draws += 1;
        player_1_stats.current_streak = 0;
        player_2_stats.current_streak = 0;
        player_1_result = 0.5;
        player_2_result = 0.5;
        break;
    case (1):
        player_1_stats.player_1_wins += 1;
        player_2_stats.player_2_losses += 1;
        player_1_stats.current_streak += 1;
        player_2_stats.current_streak = 0;
        if (player_1_stats.current_streak > player_1_stats.longest_streak) {
            player_1_stats.longest_streak = player_1_stats.current_streak;
        }
        player_1_result = 1;
        player_2_result = 0;
        break;
    case (2):
        player_1_stats.player_1_losses += 1;
        player_2_stats.player_2_wins += 1;
        player_1_stats.current_streak = 0;
        player_2_stats.current_streak += 1;
        if (player_2_stats.current_streak > player_2_stats.longest_streak) {
            player_2_stats.longest_streak = player_2_stats.current_streak;
        }
        player_1_result = 0;
        player_2_result = 1;
        break;
    }

    const new_player_1_elo = elo(
        player_1_stats.elo,
        player_2_stats.elo,
        player_1_result
    );
    const new_player_2_elo = elo(
        player_2_stats.elo,
        player_1_stats.elo,
        player_2_result
    );

    player_1_stats.elo = new_player_1_elo;
    player_2_stats.elo = new_player_2_elo;

    return Stats.get_statistics([player_1, player_2]);
};

/**
 * Custom addition (not in Freddie Page's original):
 * Get the Elo ratio of X to O. If O's Elo is 0, returns Infinity.
 * @returns {number} ratio (X Elo / O Elo)
 */
Stats.get_elo_ratio = function () {
    const stats = Stats.get_statistics(["X", "O"]);
    const x = stats.X.elo;
    const o = stats.O.elo;
    if (o === 0) {
        return Infinity;
    }
    return x / o;
};

export default Object.freeze(Stats);
