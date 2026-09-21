/* test-roster-scoring.js
 * ------------------------------------------------------------------
 * Plain Node test file, no dependencies, no test framework needed.
 * Run with:  node test-roster-scoring.js
 *
 * Every scenario's expected numbers are computed BY HAND in the
 * comments, so a future change to roster-scoring.js can be checked
 * against a human-verified baseline, not just "does it still run".
 * ------------------------------------------------------------------
 */
var assert = require("assert");
var RS = require("./roster-scoring.js");

var failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log("PASS - " + name);
  } catch (e) {
    failures++;
    console.log("FAIL - " + name);
    console.log("       " + e.message);
  }
}

function approx(a, b, tol) {
  tol = tol === undefined ? 0.01 : tol;
  return Math.abs(a - b) <= tol;
}

/* ---------- Basic statistics sanity ---------- */

check("mean/stdev of a simple population", function () {
  var values = [100, 80, 60, 40, 20];
  assert.strictEqual(RS.mean(values), 60);
  assert.ok(approx(RS.stdev(values), 28.2843, 0.001));
});

check("zFromValue matches manual calculation", function () {
  var z = RS.zFromValue(100, 60, 28.2843);
  assert.ok(approx(z, 1.4142, 0.001));
});

check("rankitZ: best rank has the highest z, worst rank the lowest", function () {
  var n = 10;
  var zBest = RS.rankitZ(1, n);
  var zWorst = RS.rankitZ(10, n);
  var zMid = RS.rankitZ(5, n);
  assert.ok(zBest > zMid);
  assert.ok(zMid > zWorst);
});

check("rankitZ is symmetric around the middle for an even population", function () {
  // rank 1 of 4 and rank 4 of 4 should be mirror images of each other
  var n = 4;
  var z1 = RS.rankitZ(1, n);
  var z4 = RS.rankitZ(4, n);
  assert.ok(approx(z1, -z4, 0.001));
});

/* ---------- Small synthetic 3-team league: QB scoring ---------- */
/*
 * League: 3 teams, 1 QB starter slot each.
 * Market values: QB1=100, QB2=80, QB3=60, QB4=40 (bench), QB5=20 (bench).
 * Team A: starts QB1 (100), benches QB4 (40)
 * Team B: starts QB2 (80),  benches QB5 (20)
 * Team C: starts QB3 (60)
 *
 * Population mean = 60, stdev = 28.2843 (see check above).
 * z(QB1)=1.4142  z(QB2)=0.7071  z(QB3)=0  z(QB4)=-0.7071  z(QB5)=-1.4142
 *
 * replacementRank = numTeams(3) * startsPerTeam(1) + 1 = 4
 * -> the 4th-best value in the league is QB4 (40) -> replacementZ = -0.7071
 *
 * Team starter VOR (z - replacementZ):
 * Team A: 1.4142 - (-0.7071) = 2.1213
 * Team B: 0.7071 - (-0.7071) = 1.4142
 * Team C: 0      - (-0.7071) = 0.7071
 *
 * Percentile among [0.7071, 1.4142, 2.1213]:
 * Team A (highest)  -> strength = round(((2+0.5)/3)*100) = 83, need = 17, LOW
 * Team B (middle)   -> strength = round(((1+0.5)/3)*100) = 50, need = 50, MEDIUM
 * Team C (lowest)   -> strength = round(((0+0.5)/3)*100) = 17, need = 83, HIGH
 */

function buildLeague() {
  var players = {
    q1: { position: "QB" }, q2: { position: "QB" }, q3: { position: "QB" },
    q4: { position: "QB" }, q5: { position: "QB" }
  };
  var values = { q1: 100, q2: 80, q3: 60, q4: 40, q5: 20 };

  var league = { roster_positions: ["QB", "BN"], total_rosters: 3 };
  var rosters = [
    { owner_id: "A", players: ["q1", "q4"], starters: ["q1"] },
    { owner_id: "B", players: ["q2", "q5"], starters: ["q2"] },
    { owner_id: "C", players: ["q3"], starters: ["q3"] }
  ];

  function classify(meta) { return meta.position === "QB" ? "QB" : null; }
  function getValue(id) { return values[id]; }
  function getIdpRank() { return undefined; }

  return { players: players, league: league, rosters: rosters, classify: classify, getValue: getValue, getIdpRank: getIdpRank };
}

check("QB scoring: Team A (best roster) gets high strength / low need", function () {
  var s = buildLeague();
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "QB",
    classify: s.classify, getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "A"
  });
  assert.strictEqual(result.strength, 83);
  assert.strictEqual(result.need, 17);
  assert.strictEqual(result.priority, "LOW");
});

check("QB scoring: Team B (middle roster) gets medium strength / medium need", function () {
  var s = buildLeague();
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "QB",
    classify: s.classify, getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "B"
  });
  assert.strictEqual(result.strength, 50);
  assert.strictEqual(result.need, 50);
  assert.strictEqual(result.priority, "MEDIUM");
});

check("QB scoring: Team C (worst roster) gets low strength / high need", function () {
  var s = buildLeague();
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "QB",
    classify: s.classify, getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "C"
  });
  assert.strictEqual(result.strength, 17);
  assert.strictEqual(result.need, 83);
  assert.strictEqual(result.priority, "HIGH");
});

/* ---------- FLEX allocation tests ---------- */

/*
 * The FLEX logic must use what this league is ACTUALLY starting in
 * the flex slot, not a guessed RB/WR/TE split.
 *
 * Synthetic league: 10 teams, one FLEX slot each.
 * Current FLEX usage: 6 WR, 3 RB, 1 TE.
 * Therefore one FLEX starter contributes:
 *   WR = 0.60, RB = 0.30, TE = 0.10 required starts per team.
 */
check("FLEX allocation follows the league's actual starter usage", function () {
  var players = {};
  var rosters = [];
  var flexPositions = ["WR", "WR", "WR", "WR", "WR", "WR", "RB", "RB", "RB", "TE"];

  flexPositions.forEach(function (pos, i) {
    var id = pos.toLowerCase() + i;
    players[id] = { position: pos };
    rosters.push({
      owner_id: String(i + 1),
      players: [id],
      starters: [id]
    });
  });

  var league = { roster_positions: ["FLEX"], total_rosters: 10 };
  function classify(meta) { return meta.position; }

  var allocation = RS.estimateFlexAllocation(
    rosters, players, league.roster_positions, classify
  );
  var req = RS.requiredStartsPerTeam(league.roster_positions, allocation);

  assert.ok(approx(req.WR, 0.60, 0.0001));
  assert.ok(approx(req.RB, 0.30, 0.0001));
  assert.ok(approx(req.TE, 0.10, 0.0001));
});

/*
 * If every team's FLEX slot is empty/unusable, there is no empirical
 * information to use. The implementation must then split the slot
 * evenly across its eligible positions instead of inventing an
 * assumed league tendency.
 */
check("Empty FLEX data falls back to an even eligible-position split", function () {
  var players = {};
  var rosters = [
    { owner_id: "1", players: [], starters: ["0"] },
    { owner_id: "2", players: [], starters: ["0"] },
    { owner_id: "3", players: [], starters: ["0"] }
  ];
  var league = { roster_positions: ["FLEX"], total_rosters: 3 };
  function classify() { return null; }

  var allocation = RS.estimateFlexAllocation(
    rosters, players, league.roster_positions, classify
  );
  var req = RS.requiredStartsPerTeam(league.roster_positions, allocation);

  assert.ok(approx(req.RB, 1 / 3, 0.0001));
  assert.ok(approx(req.WR, 1 / 3, 0.0001));
  assert.ok(approx(req.TE, 1 / 3, 0.0001));
});

/*
 * Backward compatibility: the old one-argument call intentionally has
 * no flex allocation information, so FLEX-type slots must not suddenly
 * contribute invented demand to the position totals.
 */
check("requiredStartsPerTeam keeps the old one-argument behavior", function () {
  var positions = ["QB", "RB", "WR", "TE", "FLEX", "BN"];
  var req = RS.requiredStartsPerTeam(positions);

  assert.strictEqual(req.QB, 1);
  assert.strictEqual(req.RB, 1);
  assert.strictEqual(req.WR, 1);
  assert.strictEqual(req.TE, 1);
  assert.strictEqual(req.IDP, 0);
});

/* ---------- FLEX -> scorePosition integration tests ---------- */

/*
 * Integration check: a FLEX-only position must be recognized by the
 * top-level scorePosition() path, not just by the helper functions.
 * With one FLEX slot and actual usage of WR/RB/TE, WR has a positive
 * fractional required-start demand and therefore must not return N/A.
 */
check("scorePosition integrates empirical FLEX demand", function () {
  var players = {
    wr1: { position: "WR" }, wr2: { position: "WR" },
    rb1: { position: "RB" }, te1: { position: "TE" }
  };
  var values = { wr1: 100, wr2: 80, rb1: 90, te1: 70 };
  var rosters = [
    { owner_id: "A", players: ["wr1"], starters: ["wr1"] },
    { owner_id: "B", players: ["wr2"], starters: ["wr2"] },
    { owner_id: "C", players: ["rb1"], starters: ["rb1"] },
    { owner_id: "D", players: ["te1"], starters: ["te1"] }
  ];
  var league = { roster_positions: ["FLEX"], total_rosters: 4 };

  function classify(meta) { return meta.position; }
  function getValue(id) { return values[id]; }

  var result = RS.scorePosition({
    rosters: rosters, players: players, league: league, pos: "WR",
    classify: classify, getValue: getValue,
    getIdpRank: function () { return undefined; },
    userRosterOwnerId: "A"
  });

  assert.notStrictEqual(result.strength, null);
  assert.notStrictEqual(result.need, null);
  assert.notStrictEqual(result.priority, "N/A");
});

/*
 * Integration check for the mixed fixed+FLEX case:
 * one fixed WR starter + one FLEX slot. If 3/4 teams actually use
 * the FLEX for WR, WR demand becomes 1.75 starts/team and rounds to
 * 2 only where scorePosition needs a whole-player count.
 */
check("scorePosition uses FLEX allocation in mixed fixed+FLEX demand", function () {
  var players = {
    a1: { position: "WR" }, a2: { position: "WR" },
    b1: { position: "WR" }, b2: { position: "WR" },
    c1: { position: "WR" }, d1: { position: "WR" }, d2: { position: "RB" }
  };
  var values = { a1: 100, a2: 90, b1: 80, b2: 75, c1: 70, d1: 60, d2: 50 };
  var rosters = [
    { owner_id: "A", players: ["a1", "a2"], starters: ["a1", "a2"] },
    { owner_id: "B", players: ["b1", "b2"], starters: ["b1", "b2"] },
    { owner_id: "C", players: ["c1"], starters: ["c1", "c1"] },
    { owner_id: "D", players: ["d1", "d2"], starters: ["d1", "d2"] }
  ];
  var league = { roster_positions: ["WR", "FLEX"], total_rosters: 4 };

  function classify(meta) { return meta.position; }
  function getValue(id) { return values[id]; }

  var resultA = RS.scorePosition({
    rosters: rosters, players: players, league: league, pos: "WR",
    classify: classify, getValue: getValue,
    getIdpRank: function () { return undefined; },
    userRosterOwnerId: "A"
  });
  var resultB = RS.scorePosition({
    rosters: rosters, players: players, league: league, pos: "WR",
    classify: classify, getValue: getValue,
    getIdpRank: function () { return undefined; },
    userRosterOwnerId: "B"
  });

  assert.ok(resultA.strength > resultB.strength);
  assert.ok(resultA.need < resultB.need);
});

/* ---------- Real 12-team league FLEX regression ---------- */
/*
 * Mirrors the verified 2026 Fantáziafoci league structure:
 * 12 teams, 2 fixed RB, 2 fixed WR, 1 fixed TE, and 1 normal FLEX.
 *
 * Verified current normal FLEX usage:
 *   9 RB, 3 WR, 0 TE
 *
 * Therefore the empirical FLEX allocation is:
 *   RB = 0.75, WR = 0.25, TE = 0
 *
 * Combined with fixed starters:
 *   RB = 2.75 starts/team
 *   WR = 2.25 starts/team
 *   TE = 1.00 starts/team
 *
 * This regression protects the real league behavior from future changes
 * to FLEX allocation or fractional replacement-demand handling.
 */
check("Real 12-team league: empirical FLEX demand is RB 0.75 / WR 0.25 / TE 0", function () {
  var players = {};
  var rosters = [];
  var flexPositions = [
    "RB", "RB", "RB", "RB", "RB", "RB",
    "RB", "RB", "RB", "WR", "WR", "WR"
  ];

  flexPositions.forEach(function (pos, i) {
    var id = "flex" + i;
    players[id] = { position: pos };
    rosters.push({
      owner_id: String(i + 1),
      players: [id],
      starters: ["0", "0", "0", "0", "0", "0", id]
    });
  });

  var positions = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "BN"];

  var league = { roster_positions: positions, total_rosters: 12 };
  function classify(meta) { return meta.position; }

  var allocation = RS.estimateFlexAllocation(
    rosters, players, positions, classify
  );
  var req = RS.requiredStartsPerTeam(positions, allocation);

  assert.strictEqual(allocation.counts.FLEX.RB, 9);
  assert.strictEqual(allocation.counts.FLEX.WR, 3);
  assert.strictEqual(allocation.counts.FLEX.TE || 0, 0);

  assert.ok(approx(req.RB, 2.75, 0.0001));
  assert.ok(approx(req.WR, 2.25, 0.0001));
  assert.ok(approx(req.TE, 1.00, 0.0001));
});

/* ---------- Real 12-team league SUPER_FLEX regression ---------- */
/*
 * Verified 2026 league behavior:
 * all 12 teams currently use QB in their SUPER_FLEX slot.
 *
 * This regression deliberately isolates QB + SUPER_FLEX so the test
 * proves the SUPER_FLEX allocation itself without mixing in normal
 * FLEX or IDP demand.
 */
check("Real 12-team league: SUPER_FLEX is QB 100% and adds one QB start", function () {
  var players = {};
  var rosters = [];

  for (var i = 0; i < 12; i++) {
    var id = "sfqb" + i;
    players[id] = { position: "QB" };
    rosters.push({
      owner_id: String(i + 1),
      players: [id],
      // Index 1 is SUPER_FLEX in this isolated fixture.
      starters: ["0", id]
    });
  }

  var positions = ["QB", "SUPER_FLEX"];
  var league = { roster_positions: positions, total_rosters: 12 };
  function classify(meta) { return meta.position; }

  var allocation = RS.estimateFlexAllocation(
    rosters, players, positions, classify
  );
  var req = RS.requiredStartsPerTeam(positions, allocation);

  assert.strictEqual(allocation.counts.SUPER_FLEX.QB, 12);
  assert.strictEqual(allocation.counts.SUPER_FLEX.RB || 0, 0);
  assert.strictEqual(allocation.counts.SUPER_FLEX.WR || 0, 0);
  assert.strictEqual(allocation.counts.SUPER_FLEX.TE || 0, 0);

  // Fixed QB + empirical SUPER_FLEX QB allocation = 2.00 starts/team.
  assert.ok(approx(req.QB, 2.00, 0.0001));
  assert.ok(approx(req.RB, 0, 0.0001));
  assert.ok(approx(req.WR, 0, 0.0001));
  assert.ok(approx(req.TE, 0, 0.0001));
});

/* ---------- Hard shortage override ---------- */




check("A team with fewer players than required starters is forced to HIGH need", function () {
  var s = buildLeague();
  // Require 2 QB starters per team, but Team C only has 1 QB.
  s.league.roster_positions = ["QB", "QB", "BN"];
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "QB",
    classify: s.classify, getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "C"
  });
  assert.strictEqual(result.strength, 0);
  assert.strictEqual(result.need, 100);
  assert.strictEqual(result.priority, "HIGH");
  assert.ok(result.warnings.length > 0);
});

/* ---------- Position with zero required starts ---------- */

check("A position the league doesn't start returns N/A, not a fabricated score", function () {
  var s = buildLeague();
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "TE",
    classify: function (meta) { return meta.position === "TE" ? "TE" : null; },
    getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "A"
  });
  assert.strictEqual(result.strength, null);
  assert.strictEqual(result.need, null);
  assert.strictEqual(result.priority, "N/A");
});

/* ---------- IDP rankit path ---------- */

check("IDP scoring uses rankit z-scores derived from RPO rank, not market value", function () {
  var players = {
    d1: { position: "DL" }, d2: { position: "LB" }, d3: { position: "DB" }, d4: { position: "DL" }
  };
  // Global RPO ranks (lower = better). Team A has the best (d1) and
  // worst (d4) players; Team B has the two in the middle.
  var rpoRanks = { d1: 5, d2: 40, d3: 41, d4: 200 };
  var league = { roster_positions: ["IDP", "BN"], total_rosters: 2 };
  var rosters = [
    { owner_id: "A", players: ["d1", "d4"], starters: ["d1"] },
    { owner_id: "B", players: ["d2", "d3"], starters: ["d2"] }
  ];
  function classify(meta) { return ["DL", "LB", "DB"].indexOf(meta.position) >= 0 ? "IDP" : null; }
  function getValue() { return undefined; }
  function getIdpRank(id) { return rpoRanks[id]; }

  var result = RS.scorePosition({
    rosters: rosters, players: players, league: league, pos: "IDP",
    classify: classify, getValue: getValue, getIdpRank: getIdpRank,
    userRosterOwnerId: "A"
  });
  // Team A starts d1, the single best-ranked IDP player in the whole
  // league population of 4 -> should clearly outscore Team B (d2).
  var resultB = RS.scorePosition({
    rosters: rosters, players: players, league: league, pos: "IDP",
    classify: classify, getValue: getValue, getIdpRank: getIdpRank,
    userRosterOwnerId: "B"
  });
  assert.ok(result.strength > resultB.strength);
});

/* ---------- Regression test for the reported "empty lineup slot" bug ---------- */
/*
 * Real-world case reported by the user: Team A has plenty of rostered
 * IDP depth (q1 + q4 in this simplified QB example), but the literal
 * Sleeper `starters` slot for this position is unset/empty ("0").
 * The team must still be scored from its best ROSTERED player, not
 * zeroed out just because the lineup slot is empty.
 */
check("An empty/unset starter slot does not zero out a team that has rostered depth", function () {
  var s = buildLeague();
  s.rosters[0].starters = ["0"]; // Team A's QB slot is unset, despite owning q1 (100) and q4 (40)
  var result = RS.scorePosition({
    rosters: s.rosters, players: s.players, league: s.league, pos: "QB",
    classify: s.classify, getValue: s.getValue, getIdpRank: s.getIdpRank,
    userRosterOwnerId: "A"
  });
  // Should be scored exactly as before (top rostered player = q1),
  // NOT forced to strength=0/need=100.
  assert.strictEqual(result.strength, 83);
  assert.strictEqual(result.need, 17);
  assert.strictEqual(result.priority, "LOW");
});

/* ---------- Summary ---------- */

if (failures) {
  console.log("\n" + failures + " test(s) FAILED.");
  process.exit(1);
} else {
  console.log("\nAll tests passed.");
}
