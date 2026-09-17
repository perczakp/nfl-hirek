/* roster-scoring.js
 * ------------------------------------------------------------------
 * Value-Over-Replacement (VOR) based Roster Strength / Position Needs
 * scoring, computed relative to the ACTUAL teams in the user's Sleeper
 * league (not a generic NFL-wide player pool).
 *
 * This file has NO dependency on the DOM or on my-team.html's global
 * state, so it can be loaded both in the browser and in plain Node
 * for testing (see test-roster-scoring.js).
 *
 * Exposed as `window.RosterScoring` in the browser and as
 * `module.exports` in Node.
 * ------------------------------------------------------------------
 */
(function (root) {
  "use strict";

  /* ---------- 1. Core statistics helpers ---------- */

  function mean(values) {
    if (!values.length) return 0;
    var sum = 0;
    for (var i = 0; i < values.length; i++) sum += values[i];
    return sum / values.length;
  }

  function stdev(values) {
    if (values.length < 2) return 0;
    var m = mean(values);
    var sq = 0;
    for (var i = 0; i < values.length; i++) sq += (values[i] - m) * (values[i] - m);
    // population stdev: we have the full league population, not a sample
    return Math.sqrt(sq / values.length);
  }

  function zFromValue(value, m, sd) {
    if (sd <= 0) return 0;
    return (value - m) / sd;
  }

  /* Acklam's rational approximation of the inverse standard normal CDF.
     Accurate to ~1.15e-9, no external dependency needed. */
  function invNormalCDF(p) {
    if (p <= 0) p = 1e-10;
    if (p >= 1) p = 1 - 1e-10;

    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
      1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
      6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
      -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
      3.754408661907416e+00];

    var plow = 0.02425, phigh = 1 - plow, q, r;

    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > phigh) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  /* "Rankit" transform: turn an ordinal rank (1 = best) among n players
     into a standard-normal z-score, via a continuity-corrected
     percentile. This is the statistically standard way to convert
     rank-only data (no numeric value) into something z-score-like. */
  function rankitZ(rank, n) {
    if (n <= 1) return 0;
    var p = (n - rank + 0.5) / n;
    return invNormalCDF(p);
  }

  /* ---------- 2. League population pools ---------- */

  /**
   * Builds, for one scoring position ('QB'|'RB'|'WR'|'TE'|'IDP'), the
   * full set of z-scores for every player rostered by every team in
   * the league (not just the user's team).
   *
   * @param {Array} rosters       - S.rosters (all teams' Sleeper roster objects)
   * @param {Object} players      - S.players (id -> player metadata)
   * @param {Function} classify   - (playerMeta) => 'QB'|'RB'|'WR'|'TE'|'IDP'|null
   * @param {Function} getValue   - (playerId, playerMeta) => numeric market value, or 0/undefined if unknown. Used for QB/RB/WR/TE.
   * @param {Function} getIdpRank - (playerId, playerMeta) => global RPO rank (lower = better), or undefined if unknown. Used for IDP.
   * @returns {Object} pool description with a `zById` map (playerId -> z-score)
   *                   and the `replacementZ(requiredStartsPerTeam, numTeams)` helper.
   */
  function buildPositionPool(rosters, players, pos, classify, getValue, getIdpRank) {
    var playerIds = [];
    var seen = {};
    rosters.forEach(function (r) {
      (r.players || []).forEach(function (id) {
        id = String(id);
        if (seen[id]) return;
        var meta = players[id];
        if (!meta) return;
        if (classify(meta) !== pos) return;
        seen[id] = true;
        playerIds.push(id);
      });
    });

    var zById = {};

    if (pos === "IDP") {
      // Split players into "has a known RPO rank" vs "unknown".
      var withRank = [];
      playerIds.forEach(function (id) {
        var rank = getIdpRank(id, players[id]);
        if (Number.isFinite(rank) && rank > 0) withRank.push({ id: id, rank: rank });
      });
      withRank.sort(function (a, b) { return a.rank - b.rank; }); // best (lowest) rank first
      var n = withRank.length;
      withRank.forEach(function (entry, idx) {
        zById[entry.id] = rankitZ(idx + 1, n);
      });
      // Unknown-rank players: explicitly placed just below the worst
      // known player in the league pool (not an invented flat score).
      var worstZ = n ? rankitZ(n, n) : 0;
      playerIds.forEach(function (id) {
        if (zById[id] === undefined) zById[id] = worstZ - 0.5;
      });
      return {
        type: "idp",
        size: n,
        zById: zById,
        replacementZ: function (replacementRank) {
          if (n === 0) return worstZ - 0.5;
          var rr = Math.min(Math.max(1, replacementRank), n);
          return rankitZ(rr, n);
        }
      };
    }

    // QB / RB / WR / TE: numeric market value population.
    var values = [];
    var valueById = {};
    playerIds.forEach(function (id) {
      var v = getValue(id, players[id]);
      if (Number.isFinite(v) && v > 0) {
        values.push(v);
        valueById[id] = v;
      }
    });
    var m = mean(values);
    var sd = stdev(values);
    playerIds.forEach(function (id) {
      if (valueById[id] !== undefined) {
        zById[id] = zFromValue(valueById[id], m, sd);
      }
    });
    var sortedValues = values.slice().sort(function (a, b) { return b - a; }); // best first
    var worstKnownZ = sortedValues.length ? zFromValue(sortedValues[sortedValues.length - 1], m, sd) : 0;
    playerIds.forEach(function (id) {
      if (zById[id] === undefined) zById[id] = worstKnownZ - 0.5;
    });

    return {
      type: "value",
      size: sortedValues.length,
      mean: m,
      stdev: sd,
      zById: zById,
      replacementZ: function (replacementRank) {
        if (!sortedValues.length) return worstKnownZ - 0.5;
        var rr = Math.min(Math.max(1, replacementRank), sortedValues.length);
        return zFromValue(sortedValues[rr - 1], m, sd);
      }
    };
  }

  /* ---------- 3. Required starts & replacement rank ---------- */

  function requiredStartsPerTeam(rosterPositions) {
    var req = { QB: 0, RB: 0, WR: 0, TE: 0, IDP: 0 };
    (rosterPositions || []).forEach(function (slot) {
      slot = String(slot).toUpperCase();
      if (slot === "QB") req.QB++;
      else if (slot === "RB") req.RB++;
      else if (slot === "WR") req.WR++;
      else if (slot === "TE") req.TE++;
      else if (["DL", "LB", "DB", "IDP", "IDP_FLEX"].indexOf(slot) >= 0) req.IDP++;
    });
    return req;
  }

  function replacementRank(numTeams, startsPerTeam) {
    // The first player who would NOT start anywhere in the league.
    return numTeams * startsPerTeam + 1;
  }

  /* ---------- 4. Per-team top players at a position ---------- */

  /**
   * Ranks a team's ROSTERED players at a position by z-score and
   * returns the top `target`-many. This intentionally ignores the
   * team's literal Sleeper `starters` lineup assignment, because an
   * unset or bye-week-empty starter slot is a lineup-management gap,
   * not a roster-strength gap — a team with plenty of rostered depth
   * at a position should not be scored as if it had none just because
   * a lineup slot happens to be empty at the moment of syncing.
   */
  function teamTopPlayersAtPosition(rosterObj, players, pos, classify, zById, target) {
    var ids = (rosterObj.players || []).map(String).filter(function (id) {
      var meta = players[id];
      return meta && classify(meta) === pos;
    });
    ids.sort(function (a, b) {
      var za = zById[a] !== undefined ? zById[a] : -Infinity;
      var zb = zById[b] !== undefined ? zById[b] : -Infinity;
      return zb - za;
    });
    return { rosterIds: ids, topIds: ids.slice(0, target) };
  }

  /* ---------- 5. Top-level orchestration ---------- */

  /**
   * Computes Roster Strength and Position Needs for ONE team (usually
   * the logged-in user's team) at ONE position, relative to every
   * team in the league.
   *
   * @param {Object} opts
   *   rosters, players, league (Sleeper objects, as already stored in S)
   *   classify(meta) -> 'QB'|'RB'|'WR'|'TE'|'IDP'|null
   *   getValue(id, meta) -> market value or undefined
   *   getIdpRank(id, meta) -> global RPO rank or undefined
   *   pos -> the position bucket to score
   *   userRosterOwnerId -> owner_id of the team to score
   * @returns {{strength:number, need:number, priority:string, warnings:string[]}}
   */
  function scorePosition(opts) {
    var rosters = opts.rosters, players = opts.players, league = opts.league;
    var pos = opts.pos, classify = opts.classify;
    var warnings = [];

    var pool = buildPositionPool(rosters, players, pos, classify, opts.getValue, opts.getIdpRank);
    var req = requiredStartsPerTeam(league.roster_positions);
    var startsPerTeam = req[pos] || 0;
    var numTeams = rosters.length || (league.total_rosters || 1);

    if (startsPerTeam === 0) {
      return { strength: null, need: null, priority: "N/A", warnings: ["A liga nem indít ezen a pozíción."] };
    }
    if (pool.size < numTeams * startsPerTeam) {
      warnings.push("Kevesebb ismert értékű/rangsorolt játékos van a ligában ezen a pozíción, mint amennyi starter-slot létezik; a replacement szint a legrosszabb ismert játékoshoz lett rögzítve.");
    }

    var rr = replacementRank(numTeams, startsPerTeam);
    var replZ = pool.replacementZ(rr);

    // Team-by-team total starter VOR at this position, based on each
    // team's best ROSTERED players (not their momentary lineup).
    var teamTotals = rosters.map(function (r) {
      var picked = teamTopPlayersAtPosition(r, players, pos, classify, pool.zById, startsPerTeam);
      var total = 0;
      picked.topIds.forEach(function (id) {
        var z = pool.zById[id];
        if (z === undefined) z = replZ - 1; // unknown player: treat as clearly below replacement
        total += (z - replZ);
      });
      return { ownerId: String(r.owner_id), total: total, rosterCount: picked.rosterIds.length, required: startsPerTeam };
    });

    var userTeam = teamTotals.filter(function (t) { return t.ownerId === String(opts.userRosterOwnerId); })[0];
    if (!userTeam) {
      return { strength: null, need: null, priority: "N/A", warnings: ["A felhasználó rostere nem található a liga csapatai között."] };
    }

    // Hard shortage override: not enough players ROSTERED at this
    // position to even theoretically fill the slots — a real depth
    // problem, distinct from an unset lineup slot.
    if (userTeam.rosterCount < startsPerTeam) {
      return {
        strength: 0,
        need: 100,
        priority: "HIGH",
        warnings: warnings.concat(["Nincs elég játékos ezen a pozíción a kezdő helyek feltöltéséhez."])
      };
    }

    // Percentile of the user's total VOR among all teams' totals.
    var totals = teamTotals.map(function (t) { return t.total; }).sort(function (a, b) { return a - b; });
    var below = totals.filter(function (t) { return t < userTeam.total; }).length;
    var equal = totals.filter(function (t) { return t === userTeam.total; }).length;
    var strength = Math.round(((below + equal / 2) / totals.length) * 100);
    var need = 100 - strength;
    var priority = need >= 70 ? "HIGH" : need >= 45 ? "MEDIUM" : "LOW";

    return { strength: strength, need: need, priority: priority, warnings: warnings };
  }

  var api = {
    mean: mean,
    stdev: stdev,
    zFromValue: zFromValue,
    invNormalCDF: invNormalCDF,
    rankitZ: rankitZ,
    buildPositionPool: buildPositionPool,
    requiredStartsPerTeam: requiredStartsPerTeam,
    replacementRank: replacementRank,
    teamTopPlayersAtPosition: teamTopPlayersAtPosition,
    scorePosition: scorePosition
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.RosterScoring = api;
  }
})(typeof window !== "undefined" ? window : this);
