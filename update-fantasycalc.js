const fs = require("fs");
const path = require("path");

const API_URL =
  "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1";

const OUTPUT = path.join(process.cwd(), "fantasycalc-values.json");

async function main() {
  console.log(`Fetching FantasyCalc values: ${API_URL}`);

  const response = await fetch(API_URL, {
    headers: {
      "User-Agent": "NFL Hirek Trade Calculator / FantasyCalc cache updater"
    }
  });

  if (!response.ok) {
    throw new Error(`FantasyCalc API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("FantasyCalc API returned no player values.");
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: API_URL,
    settings: {
      dynasty: true,
      teams: 12,
      ppr: 1,
      qbs: 2,
      format: "2QB / Superflex"
    },
    values: data
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Cached ${data.length} FantasyCalc entries.`);
  console.log(`Written to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
