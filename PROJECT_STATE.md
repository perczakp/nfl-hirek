# NFL Fantasy Project — PROJECT STATE

**Last updated:** 2026-09-09

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

Planned:
9. Preseason

### Navigation
Navigation is a site-wide component. Every page must contain the same links and the same layout rules.

Current 8-tab target:
- desktop: 3 + 3 + 2;
- medium/tablet: 2 columns;
- narrow mobile: 1 column.

Do not change navigation on only one page.

## 3. Permanent filename rule
When an existing production file is modified, it keeps its original filename.

Examples:
- `index.html` stays `index.html`
- `my-team.html` stays `my-team.html`
- `tips.html` stays `tips.html`

Do not create `-fixed`, `-final`, `-v2`, `index2`, or similar names as replacements for production files.

Backups are separate safety copies and may use timestamped `*.backup-*` filenames.

## 4. Current main files
- `index.html`
- `trade-chart.html`
- `rookie-idp-rankings.html`
- `IDP26rankings.html`
- `tips.html`
- `bye-weeks.html`
- `my-team.html`
- `strength-of-schedule.html`
- `fantasycalc-values.json`
- `FANTASYCALC-CACHE.md`
- `PROJECT_STATE.md`
- `PROJECT_STATE_HU.md`

Future:
- `preseason.html`

The repository currently also contains timestamped `my-team.backup-*` safety copies created during development. These are backups, not alternate production filenames.

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

# IDP / PRESEASON

## 16. 2026 IDP Rankings
`IDP26rankings.html` is a static, self-contained presentation of the RPO Football 2026 IDP rankings:
- 73 DL;
- 73 LB;
- 78 DB;
- rank, player name, and team abbreviation for each entry.

Visible sources:
- RPO Football 2026 IDP Rankings;
- published RPO ranking sheet.

The page intentionally stores the verified ranking data locally instead of relying on an iframe. Any refresh requires explicit re-verification against the RPO source.

## 17. Rookie IDP page
Canonical filename: `rookie-idp-rankings.html`.

The incorrectly named space-containing version was removed. All navigation must use the canonical filename.

## 18. Planned Preseason tab
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

## 19. FantasyPros reference work
FantasyPros was investigated as a reference for roster evaluation, including browser developer tools, page source, network activity, large JavaScript bundles, VORP/replacement concepts, and Draft Analyzer outputs.

The exact proprietary calculation was not recovered.

Do not claim exact formula replication. Use FantasyPros outputs as validation/reference points and keep the project's model transparent and independently defined.

## 20. Lessons from FantasyPros comparison
Roster analysis needs:
- league-relative context;
- position awareness;
- starter/depth awareness;
- meaningful player values;
- clear separation of rank, market value, roster strength, and roster need.

Validate against multiple real examples rather than tuning to reproduce one screenshot.

# NAVIGATION

## 21. Site-wide navigation rule
A navigation change is a site-wide change.

All pages must:
- contain the same current links;
- use the same layout rules;
- retain the same responsive behavior.

Current stable implementation uses CSS Grid.

# DEVELOPMENT WORKFLOW

## 22. Mandatory pre-change audit
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

## 23. Backup-first rule
Before modifying an existing production file:

1. Fetch the current production file.
2. Create a backup copy.
3. Verify that the backup exists.
4. Modify the original file.
5. Verify the resulting file.

If the backup cannot be created, **do not modify the original**.

Backups are safety copies, not production alternatives.

## 24. Minimal-change and verification rule
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

# CURRENT VERIFIED BASELINE

As of 2026-09-09, the latest production code change to `my-team.html` is the Sleeper starter-slot mapping correction.

Production commit:
`2a9dbc6f4e75efe96ffea366001c6f720aedf8ce`

This correction was preceded by a dedicated backup commit:
`f07891578f39c535e32539fac72afd3e8fc0c8e4`

The current repository history also shows later automated updates to the FantasyCalc cache and news/tips data; these are data refreshes and do not replace the My Fantasy Team code baseline.

The latest user feedback after the starter mapping and League Sync/Roster Strength corrections was that the result **looked correct**. This is not a substitute for a full browser/runtime test with a real Sleeper league.

# CURRENT PRIORITIES

## High priority
1. Fully runtime-test `my-team.html` with a real Sleeper league.
2. Verify current-season League Sync returns exactly the user's current leagues.
3. Verify roster loading and exact Sleeper starter slot mapping.
4. Verify player identification for the real roster.
5. Verify FantasyCalc values and missing-value fallbacks.
6. Verify Roster Strength across multiple real league examples.
7. Verify Position Needs.
8. Remove the current hidden `injuryPenalty()` effect from base player quality and show Injury Risk separately.
9. Verify navigation consistency on every page.
10. Keep `PROJECT_STATE.md` synchronized after every substantive project change.

## Next major feature
11. Build Preseason tab.
12. Establish a real free preseason data source.
13. Define the preseason JSON schema.
14. Add games, passing, rushing, and target-share data.
15. Define and test the update process after each preseason game.

# PROJECT PHILOSOPHY

**Real data > invented data**

**Transparent calculations > unexplained scores**

**League-relative context > arbitrary absolute numbers**

**Separate risk information > hidden penalties**

**Stable architecture > quick patches**

**Current repository > remembered code**

**One canonical filename > duplicate production versions**

# SESSION CONTINUATION PROTOCOL

When starting a new conversation on this project:

1. Load `PROJECT_STATE.md`.
2. Treat it as the documented project decisions and architecture.
3. Read the actual current GitHub files that will be modified.
4. Compare the documentation with the real repository state.
5. If they disagree, explicitly report the discrepancy before making a change.
6. For substantive work, perform the mandatory end-to-end audit before editing.
7. Follow the backup-first rule.
8. Update `PROJECT_STATE.md` after significant changes.

This document is project memory, but it never replaces the actual source code.

# OPEN QUESTIONS

- Final mathematical formula for Roster Strength.
- Final mathematical formula for Position Needs.
- Exact FantasyPros methodology versus our independent model.
- Final treatment of Injury Risk without changing base player value.
- Best single free source for complete preseason statistics.
- Final preseason JSON schema.
- Whether snap count can eventually be sourced from the same provider.
- Whether SOS should later influence matchup/player analysis.
- Final navigation layout after any future tabs are added.

# GOLDEN RULE

> **Never sacrifice a known working part of the project to make a new part work faster.**
>
> When in doubt: preserve the working version, perform a full audit, make a backup, make the smallest safe change, test it, and only then replace the production file.

# PROJECT STATE MAINTENANCE RULE

`PROJECT_STATE.md` is a living project-memory document and must be kept synchronized with the project.

For every significant project change:

**Audit → Backup → Code change → Test → Update PROJECT_STATE.md → Save/commit current state**

Update it when:
- a feature is added, removed, or substantially changed;
- a data source changes;
- a calculation formula/evaluation logic changes;
- an API/data-flow changes;
- a major UI/navigation decision changes;
- a previously discovered bug is fixed;
- a new recurring development rule is established;
- an important project decision is reversed/superseded;
- a major feature is verified as working.

Do not update it for every tiny CSS adjustment or typo fix unless the change materially affects project state.

# CHANGELOG

## 2026-09-09
- Reconciled `PROJECT_STATE.md` against the current GitHub repository state.
- Documented the current `my-team.html` League Sync architecture: active/current-season league discovery, core sync separated from optional enrichment, and fallback behavior when player metadata is unavailable.
- Documented the Sleeper starter-slot mapping rule: filter `BN` slots before pairing ordered starters with roster positions.
- Documented the current Roster Strength model and its independent relationship to FantasyPros.
- Recorded the known conflict between the permanent Injury Risk design decision and the current `injuryPenalty()` implementation; this remains a required future cleanup.
- Added the mandatory end-to-end pre-change audit rule based on the recent debugging lessons.
- Strengthened the backup-first workflow and documented the current verified My Team production baseline.
- Documented the presence of timestamped safety backups separately from canonical production filenames.

## 2026-09-03
- Rebuilt `IDP26rankings.html` with the complete verified RPO Football 2026 IDP rankings: 73 DL, 73 LB, and 78 DB entries.
- Replaced the broken external-sheet iframe with self-contained, responsive ranking tables and visible RPO source links.
- Renamed the Rookie IDP page to the canonical `rookie-idp-rankings.html` filename and removed the incorrectly space-named source file.
- Synchronized the Rookie and 2026 IDP navigation links across every affected page.

## 2026-08-30
- Created `PROJECT_STATE.md` as the project's persistent working-memory document.
- Established GitHub as the source of truth for current production code.
- Established the original-filename rule.
- Documented the site-wide navigation consistency requirement.
- Documented My Fantasy Team architecture and current calculation principles.
- Documented the planned Preseason feature and its current data requirements.
- Added the rule that `PROJECT_STATE.md` must be maintained as the project evolves.
