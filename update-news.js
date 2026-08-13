// GitHub Actions script: NFL Fantasy news collector
// Sources:
//   1) ESPN athlete-specific news (primary)
//   2) Google News RSS ("Player Name" NFL) as a secondary fallback
// The generated player-news.json is consumed by index.html.
// Node 20+ required (built-in fetch).

import { writeFile } from "fs/promises";

const GOOGLE_NEWS_BASE = "https://news.google.com/rss/search";
const GOOGLE_FETCH_CONCURRENCY = 6;
const GOOGLE_STALE_HOURS = 72;
const ARTICLES_PER_PLAYER = 6;

const POSITIONS = [
  "QB", "RB", "WR", "TE", "K", "DEF",
  "DL", "DE", "DT", "NT", "EDGE",
  "LB", "OLB", "ILB", "MLB",
  "DB", "CB", "S", "FS", "SS",
];

const TEAM_NAMES = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LV: "Las Vegas Raiders",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SF: "San Francisco 49ers",
  SEA: "Seattle Seahawks",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusLabel(status) {
  return status || "Healthy";
}

function buildTemplateSummary(p) {
  const status = statusLabel(p.injury_status);
  const healthy = !p.injury_status;

  if (healthy) {
    return `${p.name} (${p.position}, ${p.team}) is healthy and has drawn significant fantasy attention: ${p.adds_48h} adds over the past 48 hours.`;
  }

  return `${p.name} (${p.position}, ${p.team}) injury status: ${status}. Added by ${p.adds_48h} fantasy teams over the past 48 hours.`;
}

function cleanText(value) {
  if (value == null) return null;
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(re);
  return match ? cleanText(match[1]) : null;
}

function getTagRaw(block, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(re);
  return match ? match[1] : null;
}

function getSource(block) {
  const match = block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);
  return cleanText(match ? match[1] : null);
}

function getSourceUrl(block) {
  const match = block.match(/<source\b[^>]*\burl=["']([^"']+)["'][^>]*>/i);
  return match ? match[1] : null;
}

function getLink(block) {
  const raw = getTagRaw(block, "link");
  return raw ? cleanText(raw) : null;
}

function decodeGoogleArticleLink(link) {
  // Google News RSS intentionally exposes a Google-hosted article URL.
  // Keep it as the clickable link rather than trying to scrape the publisher.
  return link || null;
}

function parseGoogleNews(xml, player) {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const fullName = player.name.toLowerCase();
  const lastName = fullName.split(/\s+/).pop();
  const teamName = (TEAM_NAMES[player.team] || "").toLowerCase();

  return blocks.map((block) => {
    const headline = getTag(block, "title");
    const description = getTag(block, "description");
    const published = getTag(block, "pubDate");
    const source = getSource(block) || "Google News";
    const sourceUrl = getSourceUrl(block);
    const link = decodeGoogleArticleLink(getLink(block));

    if (!headline) return null;

    const haystack = `${headline} ${description || ""}`.toLowerCase();
    const hasFullName = haystack.includes(fullName);
    const hasLastName = lastName.length >= 4 && haystack.includes(lastName);
    const hasTeam = !!teamName && haystack.includes(teamName);
    const hasFootballContext = /\b(nfl|football|qb|rb|wr|te|fantasy|training camp|preseason|roster|injury|contract|trade|practice|depth chart|cardinals|chiefs|dolphins)\b/i.test(haystack);

    // Google already searched the exact full name + NFL. We still discard
    // clearly unrelated results that do not mention the full name/last name.
    if (!hasFullName && !hasLastName) return null;

    let score = 0;
    if (hasFullName) score += 5;
    if (headline.toLowerCase().includes(fullName)) score += 4;
    if (hasTeam) score += 2;
    if (hasFootballContext) score += 2;

    return {
      id: `google:${link || headline}:${published || ""}`,
      headline,
      description,
      published,
      link,
      source,
      source_url: sourceUrl,
      score,
    };
  }).filter(Boolean)
    .sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.published || 0) - new Date(a.published || 0);
    })
    .slice(0, ARTICLES_PER_PLAYER);
}

async function fetchGoogleNews(player) {
  const query = `"${player.name}" NFL`;
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });

  try {
    const res = await fetch(`${GOOGLE_NEWS_BASE}?${params.toString()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 NFL-Fantasy-News/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!res.ok) {
      console.warn(`Google News HTTP ${res.status} for ${player.name}`);
      return [];
    }

    const xml = await res.text();
    return parseGoogleNews(xml, player);
  } catch (error) {
    console.warn(`Google News failed for ${player.name}: ${error.message}`);
    return [];
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function normalizeEspnArticle(a) {
  if (!a || typeof a !== "object") return null;

  const headline = firstNonEmpty(
    a.headline,
    a.title,
    a.story?.headline,
    a.news?.headline
  );

  const description = firstNonEmpty(
    a.description,
    a.summary,
    a.story?.description,
    a.story?.summary,
    a.news?.description
  );

  const published = firstNonEmpty(
    a.published,
    a.publishedAt,
    a.date,
    a.publishedDate,
    a.story?.published,
    a.news?.published
  );

  const link = firstNonEmpty(
    a.links?.web?.href,
    Array.isArray(a.links?.web) ? a.links.web[0]?.href : null,
    a.link,
    a.href,
    a.story?.link,
    a.news?.link
  );

  const id = firstNonEmpty(
    a.id,
    a.uid,
    a.guid,
    a.storyId,
    a.newsId,
    a.story?.id,
    a.news?.id
  );

  if (!headline) return null;

  return {
    id: id ? String(id) : null,
    headline: String(headline),
    description: description ? String(description) : null,
    published: published ? String(published) : null,
    link: link ? String(link) : null,
    source: "ESPN",
    score: 100,
  };
}

function extractEspnArticles(data) {
  if (!data) return [];

  let raw = [];
  if (Array.isArray(data)) raw = data;
  else if (Array.isArray(data.articles)) raw = data.articles;
  else if (Array.isArray(data.feed)) raw = data.feed;
  else if (Array.isArray(data.news)) raw = data.news;
  else if (Array.isArray(data.items)) raw = data.items;
  else if (Array.isArray(data.contents)) raw = data.contents;
  else if (data.feed && Array.isArray(data.feed.articles)) raw = data.feed.articles;
  else if (data.news && Array.isArray(data.news.articles)) raw = data.news.articles;

  return raw.map(normalizeEspnArticle).filter(Boolean);
}

async function fetchEspnAthleteNews(espnId) {
  if (!espnId) return [];

  const url =
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes/` +
    `${encodeURIComponent(espnId)}/news?limit=20`;

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      console.warn(`ESPN athlete HTTP ${res.status} for ${espnId}`);
      return [];
    }

    return extractEspnArticles(await res.json());
  } catch (error) {
    console.warn(`ESPN athlete failed for ${espnId}: ${error.message}`);
    return [];
  }
}

async function fetchEspnFantasyNews(espnId) {
  if (!espnId) return [];

  const url =
    `https://site.api.espn.com/apis/fantasy/v2/games/ffl/news/players?` +
    `playerId=${encodeURIComponent(espnId)}&limit=10`;

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) return [];
    return extractEspnArticles(await res.json()).map((article) => ({
      ...article,
      source: "ESPN Fantasy",
      score: 90,
    }));
  } catch {
    return [];
  }
}

function newestTimestamp(articles) {
  return articles.reduce((latest, article) => {
    const time = new Date(article.published || 0).getTime();
    return Math.max(latest, Number.isFinite(time) ? time : 0);
  }, 0);
}

function shouldFetchGoogle(espnArticles) {
  if (espnArticles.length < 3) return true;

  const newest = newestTimestamp(espnArticles);
  if (!newest) return true;

  const ageHours = (Date.now() - newest) / 3600000;
  return ageHours >= GOOGLE_STALE_HOURS;
}

function dedupeArticles(groups) {
  const seen = new Set();
  const combined = [];

  for (const group of groups) {
    for (const article of group || []) {
      const headlineKey = article.headline
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      const key = article.id ||
        article.link ||
        `${headlineKey}|${article.published || ""}`;

      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(article);
    }
  }

  combined.sort((a, b) => {
    const timeDiff =
      new Date(b.published || 0).getTime() -
      new Date(a.published || 0).getTime();

    if (timeDiff !== 0) return timeDiff;
    return (b.score || 0) - (a.score || 0);
  });

  return combined.slice(0, ARTICLES_PER_PLAYER);
}

async function collectPlayerNews(player) {
  const espnArticles = await fetchEspnAthleteNews(player.espn_id);

  let googleArticles = [];
  if (shouldFetchGoogle(espnArticles)) {
    googleArticles = await fetchGoogleNews(player);
  }

  const fantasyArticles = player.isTrending
    ? await fetchEspnFantasyNews(player.espn_id)
    : [];

  const articles = dedupeArticles([
    espnArticles,
    fantasyArticles,
    googleArticles,
  ]);

  return articles.map(({ score, ...article }) => article);
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runner() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;

      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        console.warn(`Worker failed at index ${index}: ${error.message}`);
        results[index] = null;
      }

      // Small pause keeps the Action from hammering RSS/ESPN endpoints.
      await sleep(150);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => runner()
    )
  );

  return results;
}

async function fetchSleeperData() {
  console.log("Fetching trending players...");
  const trendingRes = await fetch(
    "https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=48&limit=30"
  );
  if (!trendingRes.ok) throw new Error(`Sleeper trending HTTP ${trendingRes.status}`);
  const trending = await trendingRes.json();

  console.log("Fetching full player list...");
  const playersRes = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!playersRes.ok) throw new Error(`Sleeper players HTTP ${playersRes.status}`);
  const allPlayers = await playersRes.json();

  return { trending, allPlayers };
}

async function main() {
  const { trending, allPlayers } = await fetchSleeperData();

  const trendingMap = new Map(
    trending.map((item) => [item.player_id, item.count])
  );

  const searchablePlayers = [];

  for (const id in allPlayers) {
    const p = allPlayers[id];
    if (!p || !p.full_name || !p.team || p.active === false) continue;
    if (!POSITIONS.includes(p.position)) continue;

    searchablePlayers.push({
      sleeper_id: id,
      name: p.full_name,
      team: p.team,
      position: p.position,
      injury_status: p.injury_status || null,
      injury_body_part: p.injury_body_part || null,
      injury_start_date: p.injury_start_date || null,
      practice_participation: p.practice_participation || null,
      espn_id: p.espn_id || null,
      adds_48h: trendingMap.get(id) || 0,
      isTrending: trendingMap.has(id),
    });
  }

  searchablePlayers.sort((a, b) => a.name.localeCompare(b.name));

  // Keep the existing home-page news feed focused on the top trending 30.
  const newsItems = [];
  for (const t of trending) {
    const p = allPlayers[t.player_id];
    if (!p || !p.full_name) continue;

    newsItems.push({
      name: p.full_name,
      summary: buildTemplateSummary({
        name: p.full_name,
        position: p.position || "N/A",
        team: p.team || "N/A",
        injury_status: p.injury_status,
        adds_48h: t.count,
      }),
      adds_48h: t.count,
      injury_status: p.injury_status || null,
    });
  }

  console.log(`Collecting detailed news for ${searchablePlayers.length} searchable players...`);

  const playerNewsResults = await mapWithConcurrency(
    searchablePlayers.filter((p) => p.espn_id),
    GOOGLE_FETCH_CONCURRENCY,
    async (player, index) => {
      console.log(
        `[${index + 1}] ${player.name} (${player.team})`
      );

      const articles = await collectPlayerNews(player);
      return {
        name: player.name,
        sleeper_id: player.sleeper_id,
        espn_id: player.espn_id,
        team: player.team,
        position: player.position,
        articles,
      };
    }
  );

  const playerNews = playerNewsResults.filter(Boolean);

  // Add the top ESPN/Google article to the home-page summary cards when available.
  const playerNewsByName = new Map(
    playerNews.map((item) => [item.name.toLowerCase(), item])
  );

  for (const item of newsItems) {
    const detailed = playerNewsByName.get(item.name.toLowerCase());
    const first = detailed?.articles?.[0];

    item.real_news_headline = first?.headline || null;
    item.real_news_description = first?.description || null;
    item.real_news_published = first?.published || null;
    item.real_news_source = first?.source || null;
    item.real_news_link = first?.link || null;
  }

  await writeFile(
    "news.json",
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        players: newsItems,
      },
      null,
      2
    )
  );

  await writeFile(
    "player-news.json",
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        players: playerNews,
      },
      null,
      2
    )
  );

  await writeFile(
    "players.json",
    JSON.stringify(
      {
        updated_at: new Date().toISOString(),
        players: searchablePlayers.map(
          ({ sleeper_id, adds_48h, isTrending, ...player }) => player
        ),
      },
      null,
      2
    )
  );

  console.log(`Saved ${newsItems.length} home-page players to news.json.`);
  console.log(`Saved ${playerNews.length} detailed player records to player-news.json.`);
  console.log(`Saved ${searchablePlayers.length} searchable players to players.json.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
