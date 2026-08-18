// GitHub Actions script: FantasyCalc trade values cache
// Liga-beállítás: Dynasty, 12 Teams, 1 PPR, 2 QB / Superflex
//
// Forrás: https://api.fantasycalc.com/values/current
// Nincs szükség API kulcsra.
//
// FantasyCalc attribúció: a FantasyCalc.com adatait használjuk, a
// weboldalon FantasyCalc.com-ra mutató link és "Source: FantasyCalc"
// felirat szükséges (lásd trade-chart.html).

import { writeFile } from "fs/promises";

const SOURCE_URL =
  "https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=12&ppr=1";

async function main() {
  console.log("Fetching FantasyCalc trade values...");

  const res = await fetch(SOURCE_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      "FantasyCalc API request failed: HTTP " + res.status + " " + res.statusText
    );
  }

  const raw = await res.json();

  if (!Array.isArray(raw)) {
    throw new Error(
      "Unexpected FantasyCalc response shape (expected an array). Got: " +
        JSON.stringify(raw).slice(0, 300)
    );
  }

  console.log("Fetched " + raw.length + " player entries.");

  const values = raw
    .filter((entry) => entry && entry.player && typeof entry.value === "number")
    .map((entry) => ({
      name: entry.player.name,
      sleeperId: entry.player.sleeperId || null,
      position: entry.player.position || null,
      team: entry.player.maybeTeam || null,
      value: entry.value,
      overallRank: entry.overallRank ?? null,
      positionRank: entry.positionRank ?? null,
      trend30Day: entry.trend30Day ?? null,
    }))
    .sort((a, b) => b.value - a.value);

  const output = {
    fetchedAt: new Date().toISOString(),
    source: SOURCE_URL,
    settings: {
      dynasty: true,
      teams: 12,
      ppr: 1,
      qbs: 2,
      format: "2QB / Superflex",
    },
    values: values,
  };

  await writeFile("fantasycalc-values.json", JSON.stringify(output, null, 2));
  console.log("Done. Saved " + values.length + " players to fantasycalc-values.json.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
