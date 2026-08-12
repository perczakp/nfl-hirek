// GitHub Actions script: NFL Fantasy weekly news summary
// Template-based English sentence + real ESPN news text (English)
// No API key needed. Requires Node 20+ (built-in fetch).

import { writeFile } from "fs/promises";

function statusLabel(status) {
  if (!status) return "Healthy";
  return status;
}

function buildTemplateSummary(p) {
  const status = statusLabel(p.injury_status);
  const healthy = !p.injury_status;

  if (healthy) {
    return `${p.name} (${p.position}, ${p.team}) is healthy and has drawn significant fantasy attention: ${p.adds_48h} adds over the past 48 hours.`;
  }

  return `${p.name} (${p.position}, ${p.team}) injury status: ${status}. Added by ${p.adds_48h} fantasy teams over the past 48 hours.`;
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
  console.log("Fetching trending players...");
  const trendingRes = await fetch(
    "https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=48&limit=30"
  );
  const trending = await trendingRes.json();

  console.log("Fetching full player list...");
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

    console.log(`Processing: ${playerData.name}`);
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
  console.log(`Done. Saved ${newsItems.length} players to news.json.`);

  console.log("Building searchable player list...");
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
  console.log(`Done. Saved ${searchablePlayers.length} players to players.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
