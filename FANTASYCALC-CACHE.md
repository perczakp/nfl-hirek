# FantasyCalc cache

The Trade Calculator uses `fantasycalc-values.json` instead of calling FantasyCalc
directly from every visitor's browser.

GitHub Actions refreshes the cache daily and also supports a manual run.

Current settings:
- Dynasty
- 12 teams
- 1 PPR
- 2 QB / Superflex

The cache updater is `scripts/update-fantasycalc.js`.
The workflow is `.github/workflows/update-fantasycalc-cache.yml`.

FantasyCalc attribution is displayed on `trade-chart.html`.
