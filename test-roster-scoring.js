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

/* ---------- Summary ---------- */

if (failures) {
  console.log("\n" + failures + " test(s) FAILED.");
  process.exit(1);
} else {
  console.log("\nAll tests passed.");
}
