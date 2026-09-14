# NFL Fantasy Project — PROJECT STATE

**Last updated:** 2026-09-14

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
Navigation is a site-wide component. All production pages must use the same current links and responsive layout.

Current 9-tab target:
- desktop: 3 + 3 + 3;
- tablet: 2 columns;
- narrow mobile: 1 column.

The navigation uses a shared implementation:
- `nav.js` is the single source of truth for navigation links and active-page state;
- `nav.css` is the single source of truth for navigation layout and styling;
- each production page contains the `nfln-nav-root` placeholder and loads the shared files.

The shared navigation was browser-tested by the user and confirmed working, including the responsive layout.

Do not maintain separate copied navigation markup on individual pages.

## 3. Permanent filename and rollback rules
When an existing production file is modified, it keeps its original filename.

Do not create `-fixed`, `-final`, `-v2`, `index2`, `.backup`, or similar production duplicates.

**Git version history is the default rollback mechanism.** Do not create backup copies in the production repository merely for rollback. For larger or riskier changes, use a dedicated Git branch as a safety checkpoint.

The branch `elotte-kozos-nav` is the rollback checkpoint for the shared-navigation refactor and points to the pre-refactor state.

## 4. Current production architecture
Core production files include:
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
- `nav.js`
- `nav.css`
- `player-news.json`
- `players.json`
- `fantasycalc-values.json`
- `FANTASYCALC-CACHE.md`
- `PROJECT_STATE.md`

Historical development/test files may be referenced in documentation when useful, but deleted test pages and backup copies are not production dependencies.

# RECENT COMPLETED CHANGES

## 5. Shared site-wide navigation refactor
The duplicated navigation markup across the nine production pages was replaced with a shared implementation.

`nav.js`:
- contains the canonical nine navigation links;
- determines the current page from the URL;
- applies the active state;
- renders the navigation into `nfln-nav-root`.

`nav.css`:
- contains the canonical navigation layout and styling;
- desktop: 3 columns;
- tablet: 2 columns;
- mobile: 1 column;
- active page uses the standard active button treatment;
- no page-specific navigation CSS is required.

Updated production pages:
- `index.html`
- `tips.html`
- `nfl-games.html`
- `strength-of-schedule.html`
- `trade-chart.html`
- `bye-weeks.html`
- `rookie-idp-rankings.html`
- `IDP26rankings.html`
- `my-team.html`

The user uploaded the refactor files manually after the initial ZIP upload/delete sequence. The resulting multiple commits are intentional and do not require history rewriting.

The user completed the browser test and confirmed the shared navigation works correctly.

## 6. Player news session cache and request deduplication
`index.html` now caches the `player-news.json` request for the lifetime of the page session.

Implementation behavior:
- the first request creates a shared Promise;
- subsequent player/news requests reuse the same Promise;
- concurrent requests are deduplicated;
- successful data remains cached during the page session;
- the `?ts=Date.now()` cache-buster was removed from `player-news.json`;
- a failed request clears the cached Promise so a later retry can succeed.

Commit:
`5845a1debcd80cbf2833dc18c8d0568ee81b6e02`

The user runtime-tested this feature and confirmed:
- no timestamp query parameter is sent;
- repeated player opens reuse one request;
- concurrent/in-flight requests are deduplicated;
- a blocked request shows the expected error;
- after unblocking, retry succeeds.

The unrelated `news.json` cache-busting behavior was intentionally left unchanged.

# MY FANTASY TEAM

## 7. Purpose
`my-team.html` synchronizes a user's real Sleeper fantasy league and analyzes the roster.

Core flow:

Sleeper → current-season league discovery → league selection → league/users/rosters sync → player identification → optional player/value/ranking data → roster rendering → Roster Strength + Position Needs + Injury Risk context

## 8. Sleeper integration
Sleeper is the source of truth for:
- league discovery;
- selected league settings;
- users;
- rosters;
- the user's actual roster;
- player IDs/metadata when available.

The implementation uses the Sleeper NFL state endpoint to determine the active league season and discovers leagues for that season only. Earlier multi-season discovery could duplicate displayed leagues.

Core sync:
- selected `/league/<league_id>`;
- `/league/<league_id>/users`;
- `/league/<league_id>/rosters`.

Optional enrichment:
- Sleeper `/players/nfl` metadata;
- local `fantasycalc-values.json`;
- local `IDP26rankings.html` / RPO rankings.

Optional data-source failure must not prevent the core roster from loading.

## 9. Sleeper starter/bench/taxi mapping
Sleeper's `starters` array is ordered by starter slot, while `roster_positions` also contains `BN` slots.

**Important implementation rule:** filter out `BN` slots before pairing `roster.starters` with `roster_positions`.

Current roster display:
- Starter: exact non-BN Sleeper slot order;
- Bench: roster players not in starters or taxi;
- Taxi Squad: `roster.taxi` players.

The starter order is driven by the selected league's actual `roster_positions`, not a hard-coded generic order.

## 10. Player identification and ranking concepts
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

## 11. FantasyCalc
`fantasycalc-values.json` is the local market-value dataset used by My Fantasy Team.

Current concepts include:
- market value;
- market-value percentile;
- positional value pools;
- identification by Sleeper ID and/or normalized player name.

Do not invent FantasyCalc values. If reliable value data is missing, use an explicitly documented fallback or leave the value unavailable.

The repository receives automated FantasyCalc cache updates; the cache remains an input and does not override the rule against invented values.

## 12. RPO IDP rankings in My Fantasy Team
`my-team.html` loads the local `IDP26rankings.html` and parses its ranking sections for DL/LB/DB quality context.

The local page is self-contained so My Fantasy Team does not depend on an external iframe being available at runtime.

## 13. Roster Strength
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

The model is **not** a claimed 1:1 reproduction of FantasyPros. FantasyPros is a reference for concepts such as VORP, league-relative comparison, starter value, and position strength, but its complete proprietary formula is not known.

A displayed `100/100` must not be interpreted as a mathematically perfect fantasy roster.

## 14. Position Needs
Position Needs is a **relative improvement-priority score**, not a binary "good/bad roster" score.

It answers:

> Which position should this roster improve first, and how urgent is that improvement?

A strong position should therefore have a **low but non-zero Need score** in normal circumstances. `Need = 0` must not be interpreted as "this position cannot be improved" or "this is a perfect position group."

The intended interpretation of the 0–100 scale is:
- **80–100:** HIGH / critical need;
- **60–79:** strong development need;
- **40–59:** moderate need / worth improving;
- **20–39:** relatively strong position, but still improvable;
- **1–19:** very strong position;
- **0:** reserved for exceptional/edge cases and should not be the normal result for a merely strong roster.

Roster Strength and Position Needs are separate concepts:
- **Roster Strength** measures how strong the roster/position group is;
- **Position Needs** measures how much improvement priority remains.

A possible healthy result is therefore, for example:
`WR Strength = 92`, `WR Need = 12`.

Position Needs may consider league starting requirements, roster count, starter quality, depth, and positional weakness. Injury Risk must remain a separate signal and must not silently alter base player value.

**Important:** the exact production `needScore()` formula is not changed yet. This design decision is now the specification that the formula and tests must satisfy. Any implementation change requires explicit review and regression testing.

## 15. Injury Risk
Permanent design decision:

**Injury Risk must NOT change the player's base value.**

Intended architecture:

`Base Player Value + separate Injury Risk information`

not:

`Base Player Value × hidden injury penalty`

### Current implementation note
The current `my-team.html` quality calculation still contains an `injuryPenalty()` deduction inside the quality score. This conflicts with the permanent design decision and remains a **known issue to fix before calling the Injury Risk model final**.

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
- shared site-wide navigation.

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

This creates a separation between ESPN's external data format and the page's application data format.

## 18. NFL Games runtime verification
The user browser-tested the live GitHub Pages page and confirmed:
- Week 1 loads 16 games;
- another regular-season week changes the game data correctly;
- real teams, kickoff times, venues, and statuses render;
- HOME → AWAY ordering is correct;
- day grouping works;
- Hungary Time works;
- US Eastern works;
- timezone switching changes displayed times correctly;
- neutral-site indication works for the Melbourne game;
- responsive/mobile layout works;
- the shared 9-item navigation is visible and usable;
- navigation buttons use the intended standard button size/style.

The normal user-facing NFL Games flow is runtime-validated. Auto-refresh timing and the failure-preservation path were implemented and code-reviewed but were not directly forced through a browser failure/runtime test.

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

All navigation must use the canonical filename.

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

# DEVELOPMENT WORKFLOW

## 24. Mandatory pre-change audit
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

## 25. Git-first change safety
Git history is the normal safety mechanism.

Before a substantive production change:
1. Fetch the current production file(s).
2. Inspect the current implementation and relevant history/diff.
3. Define the smallest safe modification.
4. Use a dedicated branch when the change is large or risky.
5. Commit the change with a clear message.
6. Verify the resulting files and diff.

Do not create backup copies in the production tree just to provide rollback. Roll back with Git history/revert or use a dedicated safety branch.

## 26. Minimal-change and verification rule
After a change:
1. Make the smallest necessary modification.
2. Preserve unrelated working functionality.
3. Check syntax and structural consistency.
4. Test page loading, JavaScript/data flow, navigation, visual structure, and relevant calculations whenever the environment permits.
5. Explicitly report what was and was not actually tested.

Never claim a runtime test that was not performed.

# KNOWN MISTAKES TO AVOID

- Do not create `-fixed`, `-final`, `-v2`, or similar production duplicates.
- Do not create backup copies in `main` merely for rollback.
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

# CURRENT VERIFIED BASELINE

The current `main` branch contains the shared-navigation refactor and the player-news session cache/deduplication change described above.

The user has browser-validated:
- the shared 9-item navigation;
- NFL Games normal user flow;
- player-news caching, in-flight deduplication, and retry behavior.

My Fantasy Team refactor has a Git safety checkpoint branch:
`before-my-team-refactor`

The refactor is currently in the audit/test stage. No production My Team code has been extracted or split yet.
