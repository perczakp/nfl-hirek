# NFL Fantasy Project — PROJECT STATE

**Last updated:** 2026-08-30

## 1. Project goal
Build a free NFL fantasy web application hosted on GitHub Pages, using real data where possible and keeping calculations transparent and stable.

## 2. Current site tabs
1. Players Trending
2. Dynasty Trade Calculator
3. IDP Rankings (Rookies)
4. Tips
5. Bye Weeks
6. My Fantasy Team
7. Strength of Schedule

Planned:
8. Preseason

### Navigation
Navigation is a site-wide component. Every page must contain the same links and the same layout rules. The current 7-tab layout is intentionally multi-row. When Preseason is added, the target is a clean 4 + 4 layout.

## 3. Permanent filename rule
When an existing file is modified, it keeps its original filename.

Examples:
- index.html → index.html
- my-team.html → my-team.html
- tips.html → tips.html
- strength-of-schedule.html → strength-of-schedule.html

Never create `-fixed`, `-final`, `-v2`, `index2`, or similar duplicate names for modified production files.

## 4. Current main files
- index.html
- trade-chart.html
- idp-rankings.html
- tips.html
- bye-weeks.html
- my-team.html
- strength-of-schedule.html

Future:
- preseason.html

Repository:
`perczakp/nfl-hirek`

GitHub should be treated as the source of truth for deployed code.

## 5. Development rules
Before changing an existing page:
1. Use the current GitHub/RAW version as the source of truth when available.
2. Do not rely on memory of an older code version.
3. Preserve existing working functionality.
4. Make the smallest necessary change.
5. Keep the original filename.
6. Test the resulting page before declaring it complete.
7. Back up major working versions before replacement.

Never assume two HTML pages share identical CSS or navigation.

# MY FANTASY TEAM

## 6. Purpose
`my-team.html` synchronizes the user's real Sleeper fantasy league and analyzes their roster.

Core flow:

Sleeper → League selection → Roster sync → Player identification → Fantasy value/ranking data → Roster analysis → Roster Strength + Position Needs + Injury Risk + Bye Week information

## 7. Sleeper
Sleeper is the source of truth for:
- league selection;
- league settings;
- rosters;
- the user's actual roster;
- player identification/data.

The roster must come from the selected real Sleeper league, not hard-coded example players.

## 8. Player rankings
For offensive players:
- QB
- RB
- WR
- TE

Sleeper player-ranking information is intended to provide ranking/statistical context.

Defensive/IDP players follow the same general principle using relevant defensive data.

Ranking and market value are different concepts and must not be treated as interchangeable.

## 9. FantasyCalc
FantasyCalc market value is an important input for player valuation.

The My Fantasy Team model has used concepts including:
- market value;
- market-value percentile;
- positional value pools;
- identification by Sleeper ID and/or name.

Do not invent a high FantasyCalc value when reliable data is missing. Missing values should remain missing or use an explicitly documented fallback.

## 10. Roster Strength
Roster Strength answers:

> How strong is my roster compared with the other teams in my league?

It should consider:
- player quality;
- starter quality;
- positional depth;
- league roster requirements;
- positional value;
- relevant injury information.

A literal 100/100 should not imply a perfect fantasy roster.

Relative league ranking is important. For example, `1/12` can correctly mean the user's team is the strongest of 12 teams at that positional category.

## 11. Position Needs
Position Needs answers:

> Which position should this team improve first?

It should consider:
- league starting requirements;
- number of players at the position;
- starter quality;
- depth;
- positional weakness;
- injury situation where appropriate.

Output can use:
- HIGH
- MEDIUM
- LOW

The exact formula must not be silently changed without checking its effect.

## 12. Injury Risk
Permanent design decision:

**Injury Risk must NOT change the player's base value.**

Show injury information separately so the user can make their own judgment.

Conceptually:

`Base Player Value + separate Injury Risk information`

not:

`Base Player Value × hidden injury penalty`

The purpose is to show injury history/current concern without pretending it changes the objective underlying player value.

## 13. Bye Weeks
`bye-weeks.html` provides NFL bye-week information.

Bye-week information is also relevant to My Fantasy Team analysis and should help identify roster availability problems.

## 14. Strength of Schedule
`strength-of-schedule.html` is a separate tab linked from the site's navigation.

Current preseason concept:
- 2026 NFL schedule difficulty;
- opponent strength based on opponents' previous-season combined winning percentage;
- all 32 NFL teams;
- columns include SOS Rank, Team, Abbreviation, Rank, Opponent Win %.

The page explicitly treats this as a preseason starting point.

SOS should not automatically be mixed into base player value unless explicitly decided and documented.

# PRESEASON

## 15. Planned Preseason tab
A future `Preseason` tab should cover:
- QB
- RB
- WR
- TE

The database should grow after each new preseason game.

Discussed fields:
- games played;
- target share;
- passing statistics;
- rushing statistics.

The user prefers separate **Passing** and **Rushing** columns/sections.

### Snap count
Snap count was investigated and is currently **not included**.

## 16. Preseason data-source direction
The Football Database and NFL.com were investigated as potential sources.

The user prefers, if possible, to obtain all relevant information from one free sports website.

JSON is considered a suitable architecture for a growing preseason dataset.

Preseason is not considered complete until the real data source, schema, and update process are tested.

# FANTASYPROS RESEARCH

## 17. FantasyPros investigation
FantasyPros was used as a reference for roster evaluation.

We investigated browser developer tools, page source, network activity, large JavaScript bundles, and possible VORP/replacement concepts.

A very large bundled codebase was encountered, and simple searches for `VORP` and `replacement` did not reveal the complete calculation.

Do not assume one visible formula in compiled/minified code represents the entire FantasyPros model.

## 18. Lessons from FantasyPros comparison
Roster analysis needs:
- league-relative context;
- position awareness;
- starter/depth awareness;
- meaningful player values;
- clear separation of rank, market value, and roster need.

The model should be validated against real examples rather than tuned only to reproduce one screenshot.

# NAVIGATION LESSONS

## 19. Navigation bug
A previous change caused:
- some pages to show all tabs on one line;
- others to use multiple rows;
- one page to show only four tabs.

Root cause: individual pages did not all use identical navigation structures/CSS.

Correct approach:
- navigation is a site-wide component;
- all pages must contain the same links;
- all pages must use the same layout rules;
- changing one page is not enough.

The current stable direction uses CSS Grid rather than relying only on flex wrapping.

## 20. Current target layout
With 7 tabs:
- Row 1: 3
- Row 2: 3
- Row 3: 1

With 8 tabs after Preseason:
- target: 4 + 4

Do not sacrifice working page content just to change navigation.

# KNOWN MISTAKES TO AVOID

- Do not create duplicate `-fixed` / `-final` files.
- Do not rename existing production files unnecessarily.
- Do not modify only one page's navigation.
- Do not assume old code is the current deployed code.
- Do not replace working JavaScript with mock code.
- Do not invent FantasyCalc values.
- Do not silently let Injury Risk alter base player value.
- Do not call an untested preview working.
- Do not present sample data as real data.
- Do not silently change calculation logic.
- Do not claim a generated ZIP was tested merely because it was generated.

# CURRENT PRIORITIES

## High priority
1. Fully test `my-team.html` with a real Sleeper league.
2. Verify League Sync.
3. Verify roster loading.
4. Verify player identification.
5. Verify FantasyCalc values.
6. Verify Roster Strength.
7. Verify Position Needs.
8. Verify Injury Risk display without changing base value.
9. Verify navigation on every page.

## Next major feature
10. Build Preseason tab.
11. Establish a real free preseason data source.
12. Define preseason JSON schema.
13. Add games, passing, rushing, target share.
14. Update/append the dataset after each preseason game.

# PROJECT WORKFLOW

For every future change:

1. Establish the current state from the actual repository/files.
2. Identify affected dependencies.
3. Make the smallest necessary change.
4. Test page loading, navigation, JavaScript/data flow, visual structure, and existing functionality.
5. Report objectively what changed, why, what was tested, and what was not tested.
6. Preserve the original filename.
7. Back up before major changes.

# PROJECT PHILOSOPHY

**Real data > invented data**

**Transparent calculations > unexplained scores**

**Relative league context > arbitrary absolute numbers**

**Separate risk information > hidden penalties**

**Stable architecture > quick patches**

**Current repository > remembered code**

**One canonical filename > duplicate versions**

# SESSION CONTINUATION PROTOCOL

When starting a new conversation:

1. Load `PROJECT_STATE.md`.
2. Treat it as the documented project decisions and architecture.
3. Read/retrieve the current repository files that will actually be modified.
4. Compare documentation against actual code.
5. If they disagree, do not silently choose one; report the discrepancy.
6. Update `PROJECT_STATE.md` after significant decisions or completed features.

This file is project memory. It is not a substitute for the actual source code.

# OPEN QUESTIONS

- Exact final mathematical formula for Roster Strength.
- Exact final mathematical formula for Position Needs.
- Exact FantasyPros methodology versus our independent model.
- Best single free source for complete preseason statistics.
- Final preseason JSON schema.
- Whether snap count can eventually be sourced from the same provider.
- Whether SOS should later influence matchup/player analysis.
- Final 8-tab navigation layout after Preseason is added.

# GOLDEN RULE

> Never sacrifice a known working part of the project to make a new part work faster.
>
> When in doubt: preserve the working version, make a backup, test the change, and only then replace the production file.


# 29. PROJECT STATE MAINTENANCE RULE

`PROJECT_STATE.md` is a living project-memory document and must be kept in sync with the project.

### Update workflow

For every **significant** project change:

**Code change → Test → Update PROJECT_STATE.md → Save/commit current state**

The document should be updated when any of the following changes:
- a feature is added, removed, or substantially changed;
- a data source changes;
- a calculation formula or evaluation logic changes;
- an API/data-flow changes;
- a major UI/navigation decision changes;
- a previously discovered bug is fixed;
- a new recurring development rule is established;
- an important project decision is reversed or superseded;
- a major feature is verified as working.

### What to record

When appropriate, update:
- current feature status;
- architecture/data flow;
- data sources;
- calculation rules;
- important design decisions;
- known issues and their resolutions;
- lessons learned / mistakes to avoid;
- current priorities;
- open questions;
- changelog.

### Do NOT over-document

Do not update `PROJECT_STATE.md` for every tiny CSS adjustment, typo fix, or other change that does not materially affect project state.

The goal is to keep it useful as a compact but sufficiently detailed project memory, not to turn it into a complete commit log.

## 30. CHANGELOG

Use the changelog to record significant project milestones and decisions.

Initial entries:

### 2026-08-30
- Created `PROJECT_STATE.md` as the project's persistent working-memory document.
- Established GitHub as the source of truth for current production code.
- Established the original-filename rule: modified files retain their original names.
- Documented the site-wide navigation consistency requirement.
- Documented My Fantasy Team architecture and current calculation principles.
- Documented the planned Preseason feature and its current data requirements.
- Added the rule that `PROJECT_STATE.md` must be maintained as the project evolves.
