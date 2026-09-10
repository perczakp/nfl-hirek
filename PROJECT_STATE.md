# NFL Fantasy Project — PROJECT STATE

**Last updated:** 2026-09-10

## 1. Project goal
Build a free NFL fantasy web application hosted on GitHub Pages, using real data where possible and keeping calculations transparent, stable, and explainable.

**Source of truth:** the current GitHub repository, not remembered or previously generated code.

Repository: `perczakp/nfl-hirek`

## 2. Current site tabs
1. Players Trending
2. Dynasty Trade Calculator
3. IDP Rankings (Rookies)
4. Tips
5. Bye Weeks
6. My Fantasy Team
7. Strength of Schedule
8. 2026 IDP Rankings
9. NFL Games

Planned:
10. Preseason

### Navigation
Navigation is a site-wide component. Every page must contain the same current links and the same layout rules.

Current 9-tab target:
- desktop: 3 + 3 + 3;
- medium/tablet: 2 columns;
- narrow mobile: 1 column.

The navigation buttons use the same standard button-style treatment as the page controls, with the current page shown as active.

Do not change navigation on only one page.

## 3. Permanent filename rule
When an existing production file is modified, it keeps its original filename.

Examples:
- `index.html` stays `index.html`
- `my-team.html` stays `my-team.html`
- `tips.html` stays `tips.html`

Do not create `-fixed`, `-final`, `-v2`, `index2`, or similar names as replacements for production files.

Backups are separate safety copies and may use dedicated backup branches. They should not live in the GitHub Pages production root.

## 4. Current main files
- `index.html`
- `trade-chart.html`
- `rookie-idp-rankings.html`
- `IDP26rankings.html`
- `tips.html`
- `bye-weeks.html`
- `my-team.html`
- `strength-of-schedule.html`
- `nfl-games.html`
- `nfl-games.js`
- `fantasycalc-values.json`
- `FANTASYCALC-CACHE.md`
- `PROJECT_STATE.md`
- `PROJECT_STATE_HU.md`

Future:
- `preseason.html`

Development backup files and temporary test pages are not part of the production tree. Git history and dedicated backup branches are used to preserve development states.

# MY FANTASY TEAM

## 5. Purpose
`my-team.html` synchronizes a user's real Sleeper fantasy league and analyzes the roster.

Core flow:

Sleeper → current-season league discovery → league selection → league/users/rosters sync → player identification → optional player/value/ranking data → roster rendering → Roster Strength + Position Needs + Injury Risk context

## 6. Sleeper integration
Sleeper is the source of truth for:
- league discovery;
- selected league settings;
- users;
- rosters;
- the user's actual roster;
- player IDs/metadata when available.

### Current League Sync design
The current implementation uses the Sleeper NFL state endpoint to determine the active league season and then discovers leagues for that season only.

This is intentional. Earlier multi-season discovery produced more leagues than actually existed for the user's current season (for example, 3 real leagues becoming 6 displayed leagues).

The current sync separates core league/roster synchronization from optional player metadata and external valuation/ranking data. Optional data-source failure must not prevent the core roster from loading.

Core sync:
- selected `/league/<league_id>`;
- `/league/<league_id>/users`;
- `/league/<league_id>/rosters`.

Optional enrichment:
- Sleeper `/players/nfl` metadata;
- local `fantasycalc-values.json`;
- local `IDP26rankings.html` / RPO rankings.

If player metadata is unavailable, the roster can fall back to player IDs rather than failing the entire sync.

## 7. Sleeper starter/bench/taxi mapping
Sleeper's `starters` array is ordered by starter slot, while `roster_positions` also contains `BN` slots.

**Important implementation rule:** filter out `BN` slots before pairing `roster.starters` with `roster_positions`.

Otherwise starter players become shifted into the wrong slots after the first bench position.

Current roster display:
- Starter: exact non-BN Sleeper slot order;
- Bench: roster players not in starters or taxi;
- Taxi Squad: `roster.taxi` players.

The starter order is driven by the selected league's actual `roster_positions`, not a hard-coded generic order.

## 8. Player identification and ranking concepts
Offensive positions:
- QB
- RB
- WR
- TE

IDP positions are normalized to:
- DL
- LB
- DB

`DE`, `DT`, `NT`, `EDGE`, `OLB`, `ILB`, `MLB`, `CB`, `S`, `FS`, and `SS` are mapped to the project's broader DL/LB/DB categories where applicable.

Ranking, market value, and roster need are separate concepts and must not be treated as interchangeable.

## 9. FantasyCalc
`fantasycalc-values.json` is the local market-value dataset used by My Fantasy Team.

Current concepts include:
- market value;
- market-value percentile;
- positional value pools;
- identification by Sleeper ID and/or normalized player name.

Do not invent FantasyCalc values. If reliable value data is missing, use an explicitly documented fallback or leave the value unavailable.

The repository currently receives automated FantasyCalc cache updates; the cache itself remains an input and does not override the rule against invented values.

## 10. RPO IDP rankings in My Fantasy Team
`my-team.html` loads the local `IDP26rankings.html` and parses its ranking sections for DL/LB/DB quality context.

The local page is self-contained so My Fantasy Team does not depend on an external iframe being available at runtime.

## 11. Roster Strength
Roster Strength answers:

> How strong is this roster relative to the other teams in the selected league?

The current implementation uses a transparent independent model incorporating:
- player quality;
- starter quality;
- positional depth;
- league roster requirements;
- positional value context;
- relevant injury information.

Current player-quality inputs:
- offense: FantasyCalc market-value percentile;
- IDP: RPO Football ranking converted to a quality scale;
- missing data: explicit fallback rather than invented market value.

The current model is **not** a claimed 1:1 reproduction of FantasyPros. FantasyPros was used as a reference for concepts such as VORP, league-relative comparison, starter value, and position strength, but its complete proprietary formula is not known.

A displayed `100/100` must not be interpreted as a mathematically perfect fantasy roster.

## 12. Position Needs
Position Needs answers:

> Which position should this roster improve first?

It considers:
- league starting requirements;
- number of players at the position;
- starter quality;
- depth;
- positional weakness;
- injury situation where appropriate.

Output categories:
- HIGH
- MEDIUM
- LOW

The exact formula remains an open design item and must not be changed silently.

## 13. Injury Risk
Permanent design decision:

**Injury Risk must NOT change the player's base value.**

The intended architecture is:

`Base Player Value + separate Injury Risk information`

not:

`Base Player Value × hidden injury penalty`

### Current implementation note
The current `my-team.html` quality calculation still contains an `injuryPenalty()` deduction inside the quality score. This conflicts with the permanent design decision above and is therefore a **known issue to fix before calling the Injury Risk model final**.

Do not expand or rely on this penalty logic as a permanent part of the valuation model.

## 14. Bye Weeks
`bye-weeks.html` provides NFL bye-week information.

Bye-week information is relevant to roster analysis and can help identify availability problems.

## 15. Strength of Schedule
`strength-of-schedule.html` is a separate navigation tab.

Current preseason concept:
- 2026 NFL schedule difficulty;
- opponent strength based on opponents' previous-season combined winning percentage;
- all 32 NFL teams;
- SOS Rank, Team, Abbreviation, Rank, Opponent Win %.

SOS should not automatically alter base player value unless explicitly decided and documented.

# NFL GAMES

## 16. NFL Games page
`nfl-games.html` is the completed NFL Games feature page.

The page uses the shared `nfl-games.js` normalization layer rather than consuming ESPN's raw event structure directly.

Current functionality:
- Week 1–18 selector;
- Previous Week / Next Week controls;
- real ESPN regular-season game data;
- home-first display: HOME → AWAY;
- kickoff time;
- Hungary Time ↔ US Eastern timezone switch;
- day grouping based on the selected timezone;
- UPCOMING / LIVE / FINAL status mapping;
- scores when supplied by ESPN;
- venue and location;
- neutral-site indication;
- slower automatic refresh for pre-game data and faster refresh for LIVE games;
- non-destructive error handling that keeps the last successful data visible when a later request fails;
- responsive desktop/mobile layout;
- site-wide 9-item navigation.

## 17. ESPN game-data normalization
`nfl-games.js` converts ESPN scoreboard events into a stable application-specific game shape.

The normalized game contains:
- game ID;
- season year/type;
- week;
- kickoff UTC timestamp;
- normalized home and away teams;
- normalized game status;
- venue information;
- neutral-site flag.

ESPN status mapping:
- `pre` → `UPCOMING`;
- `in` → `LIVE`;
- `post` or completed → `FINAL`;
- anything else → `UNKNOWN`.

The normalized status also preserves ESPN status metadata such as state, name, description, completed flag, clock, display clock, and period where available.

This creates a separation between the ESPN data format and the web page's data format.

## 18. NFL Games runtime verification
`nfl-games-normalization-test.html` verified the normalization layer against real ESPN data before the NFL Games page was built.

Browser testing by the user then verified the live GitHub Pages page, including:
- Week 1 loads 16 games;
- another regular-season week changes the game data correctly (Week 7 showed 14 games);
- real teams, kickoff times, venues, and statuses render;
- HOME → AWAY ordering is correct;
- day grouping works;
- Hungary Time works;
- US Eastern works;
- timezone switching changes displayed times correctly;
- neutral-site indication works for the Melbourne game;
- responsive/mobile layout works;
- the 9-item site-wide navigation is visible and usable;
- navigation buttons use the intended standard button size/style.

The normal user-facing NFL Games flow is therefore runtime-validated. Auto-refresh timing and the failure-preservation path were implemented and code-reviewed but were not directly forced through a browser failure/runtime test.

# IDP / PRESEASON

## 19. 2026 IDP Rankings
`IDP26rankings.html` is a static, self-contained presentation of the RPO Football 2026 IDP rankings:
- 73 DL;
- 73 LB;
- 78 DB;
- rank, player name, and team abbreviation for each entry.

Visible sources:
- RPO Football 2026 IDP Rankings;
- published RPO ranking sheet.

The page intentionally stores the verified ranking data locally instead of relying on an iframe. Any refresh requires explicit re-verification against the RPO source.

## 20. Rookie IDP page
Canonical filename: `rookie-idp-rankings.html`.

The incorrectly named space-containing version was removed. All navigation must use the canonical filename.

## 21. Planned Preseason tab
Future `Preseason` tab should cover:
- QB
- RB
- WR
- TE

The dataset should grow after each preseason game.

Discussed fields:
- games played;
- target share;
- passing statistics;
- rushing statistics.

The user prefers separate **Passing** and **Rushing** columns/sections.

Snap count has been investigated but is currently not included.

Preseason is not complete until the real data source, schema, and update process are tested.

# FANTASYPROS RESEARCH

## 22. FantasyPros reference work
FantasyPros was investigated as a reference for roster evaluation, including browser developer tools, page source, network activity, large JavaScript bundles, VORP/replacement concepts, and Draft Analyzer outputs.

The exact proprietary calculation was not recovered.

Do not claim exact formula replication. Use FantasyPros outputs as validation/reference points and keep the project's model transparent and independently defined.

## 23. Lessons from FantasyPros comparison
Roster analysis needs:
- league-relative context;
- position awareness;
- starter/depth awareness;
- meaningful player values;
- clear separation of rank, market value, roster strength, and roster need.

Validate against multiple real examples rather than tuning to reproduce one screenshot.

# NAVIGATION

## 24. Site-wide navigation rule
A navigation change is a site-wide change.

All pages must:
- contain the same current links;
- use the same layout rules;
- retain the same responsive behavior.

Current stable implementation uses CSS Grid with the 9 current navigation items.

# DEVELOPMENT WORKFLOW

## 25. Mandatory pre-change audit
For a substantive change, **do not start by editing code**.

First:
1. Establish the actual current state from GitHub.
2. Inspect the complete relevant data flow end-to-end.
3. Identify affected files, APIs, dependencies, and calculations.
4. Compare current code with `PROJECT_STATE.md`.
5. Identify the root cause, not just the visible symptom.
6. Check the last known-good version when a working baseline exists.
7. Define the smallest safe change.

This rule was added after the League Sync / Roster Strength debugging cycle demonstrated that partial fixes can create new failures or preserve the wrong data flow.

## 26. Backup-first rule
Before modifying an existing production file:

1. Fetch the current production file.
2. Create a backup copy.
3. Verify that the backup exists.
4. Modify the original file.
5. Verify the resulting file.

If the backup cannot be created, **do not modify the original**.

Backups are safety copies, not production alternatives.

## 27. Minimal-change and verification rule
After the backup:
1. Make the smallest necessary modification.
2. Preserve all unrelated working functionality.
3. Check syntax and structural consistency.
4. Test page loading, JavaScript/data flow, navigation, visual structure, and relevant calculations whenever the environment permits.
5. Explicitly report what was and was not actually tested.

Never claim a runtime test that was not performed.

# KNOWN MISTAKES TO AVOID

- Do not create `-fixed`, `-final`, `-v2`, or similar production duplicates.
- Do not rename production files unnecessarily.
- Do not modify only one page's navigation.
- Do not assume remembered/older code is current.
- Do not replace working JavaScript with mock or placeholder code.
- Do not invent FantasyCalc values.
- Do not silently let Injury Risk alter base player value.
- Do not call an untested preview working.
- Do not present sample data as real data.
- Do not silently change calculation logic.
- Do not claim a generated ZIP was tested merely because it was generated.
- Do not aggregate multiple Sleeper seasons when the feature requires the active/current league season.
- Do not pair `roster.starters` against the full `roster_positions` array without filtering `BN` slots.
- Do not let optional data-source failures prevent core League Sync.
- Do not fix a complex subsystem piecemeal without first auditing its end-to-end data flow.
- Do not keep manual backup copies or temporary test pages in the GitHub Pages production root.

# CURRENT VERIFIED BASELINE

As of 2026-09-10, the latest production change is the NFL Games navigation button styling.

Latest production commit:
`1276292953fb1d829b6c5efd4cdaab3d8a781905`

The latest My Fantasy Team code baseline remains the Sleeper starter-slot mapping correction:
`2a9dbc6f4e75efe96ffea366001c6f720aedf8ce`

That correction was preceded by a dedicated backup commit:
`f07891578f39c535e32539fac72afd3e8fc0c8e4`

The current repository history also shows later automated updates to the FantasyCalc cache and news/tips data; these are data refreshes and do not replace the My Fantasy Team code baseline.

The latest user feedback after the starter mapping and League Sync/Roster Strength corrections was that the result looked correct. This is not a substitute for a full browser/runtime test with a real Sleeper league.

The NFL Games feature is now integrated into the site-wide navigation and has been browser-validated for its normal user flow.

# CURRENT PRIORITIES

## P0 — My Fantasy Team stability and correctness
1. Fully runtime-test `my-team.html` with a real Sleeper league.
2. Verify current-season League Sync returns exactly the user's current leagues.
3. Verify roster loading and exact Sleeper starter slot mapping.
4. Verify player identification for the real roster.
5. Verify FantasyCalc values and missing-value fallbacks.
6. Verify Roster Strength across multiple real league examples.
7. Verify Position Needs.
8. Remove the current hidden `injuryPenalty()` effect from base player quality and show Injury Risk separately.

## P1 — Project reliability and maintenance
9. Verify navigation consistency on every production page after the 9-tab integration.
10. Audit the GitHub Actions news/tips and FantasyCalc refresh workflows for failure handling and stale-data behavior.
11. Review the size and loading behavior of large JSON datasets such as `player-news.json` and `players.json` before peak season traffic.
12. Keep `PROJECT_STATE.md` synchronized after every substantive project change.
13. Gradually move development backups out of the production `main` tree and keep safety copies in dedicated backup branches where practical.
14. Keep repo hygiene clean: manual backup files and temporary test pages must stay out of the GitHub Pages production root.

## P2 — Testing and code quality
15. Expand the current browser normalization test into a lightweight regression suite for the most important data flows.
16. Audit dynamic HTML rendering and external-data handling for maintainability and safe DOM practices.
17. Perform a full cross-page mobile/desktop regression pass after major navigation or layout changes.

## Next major feature
18. Build Preseason tab.
19. Establish a real free preseason data source.
20. Define the preseason JSON schema.
21. Add games, passing, rushing, and target-share data.
22. Define and test the update process after each preseason game.

# PROJECT PHILOSOPHY

The project should prefer:

**Real data → transparent logic → small safe changes → explicit testing → documented state.**

Do not optimize for adding features quickly at the expense of data correctness or stability.
