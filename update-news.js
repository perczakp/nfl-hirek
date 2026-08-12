// GitHub Actions script: NFL Fantasy heti hír-összefoglaló
// Sablon-alapú magyar mondat + valódi ESPN hírszöveg (angolul)
// Nincs szükség semmilyen API kulcsra. Node 20+ szükséges (beépített fetch).

import { writeFile } from "fs/promises";

const STATUS_HU = {
  Questionable: "Kérdéses",
  Doubtful: "Valószínűleg nem játszik",
  Out: "Nem játszik",
  IR: "Sérültlistán",
  PUP: "Sérültlistán (PUP)",
  Suspended: "Eltiltva",
};

function translateStatus(status) {
  if (!status) return "Egészséges";
  return STATUS_HU[status] || status;
}

function buildTemplateSummary(p) {
  const statusHu = translateStatus(p.injury_status);
  const healthy = !p.injury_status;

  if (healthy) {
    return `${p.name} (${p.position}, ${p.team}) egészséges és jelentős fantasy-figyelmet kapott: ${p.adds_48h} felvétel történt az elmúlt 48 órában.`;
  }

  return `${p.name} (${p.position}, ${p.team}) sérülés-státusza: ${statusHu}. Az elmúlt 48 órában ${p.adds_48h} alkalommal vették fel fantasy csapatokba.`;
}

async function fetchEspnNews(espnId) {
  if (!espnId) return null;

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/fantasy/v2/games/ffl/news/players?playerId=${espnId}&limit=1`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const item = data && data.feed && data.feed[0];
    if (!item) return null;

    return {
      headline: item.headline || null,
      description: item.description || null,
      published: item.published || null,
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("Trending játékosok lekérése...");
  const trendingRes = await fetch(
    "https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=48&limit=30"
  );
  const trending = await trendingRes.json();

  console.log("Teljes játékos-lista lekérése...");
  const playersRes = await fetch("https://api.sleeper.app/v1/players/nfl");
  const allPlayers = await playersRes.json();

  const newsItems = [];

  for (const t of trending) {
    const p = allPlayers[t.player_id];
    if (!p || !p.full_name) continue;

    const playerData = {
      name: p.full_name,
      team: p.team || "N/A",
      position: p.position || "N/A",
      injury_status: p.injury_status,
      adds_48h: t.count,
    };

    console.log(`Feldolgozás: ${playerData.name}`);
    const templateSummary = buildTemplateSummary(playerData);
    const espnNews = await fetchEspnNews(p.espn_id);

    newsItems.push({
      name: playerData.name,
      summary: templateSummary,
      real_news_headline: espnNews ? espnNews.headline : null,
      real_news_description: espnNews ? espnNews.description : null,
      real_news_published: espnNews ? espnNews.published : null,
    });
  }

  const output = {
    updated_at: new Date().toISOString(),
    players: newsItems,
  };

  await writeFile("news.json", JSON.stringify(output, null, 2));
  console.log(`Kész. ${newsItems.length} játékos mentve a news.json fájlba.`);

  // Teljes, kereshető játékos-lista építése (csak aktív, csapattal rendelkező játékosok)
  console.log("Kereshető játékos-lista építése...");
  const searchablePlayers = [];

  for (const id in allPlayers) {
    const p = allPlayers[id];
    if (!p || !p.full_name || !p.team || p.active === false) continue;
    if (!["QB", "RB", "WR", "TE", "K", "DEF"].includes(p.position)) continue;

    searchablePlayers.push({
      name: p.full_name,
      team: p.team,
      position: p.position,
      injury_status: p.injury_status || null,
      injury_body_part: p.injury_body_part || null,
    });
  }

  searchablePlayers.sort((a, b) => a.name.localeCompare(b.name));

  await writeFile(
    "players.json",
    JSON.stringify(
      { updated_at: new Date().toISOString(), players: searchablePlayers },
      null,
      2
    )
  );
  console.log(`Kész. ${searchablePlayers.length} játékos mentve a players.json fájlba.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
