const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/**
 * Normalize one ESPN scoreboard event into the application's stable game shape.
 * The UI should consume this shape instead of depending on ESPN's raw JSON.
 */
function normalizeEspnGame(event) {
  const competition = event?.competitions?.[0];
  if (!competition) return null;

  const competitors = Array.isArray(competition.competitors)
    ? competition.competitors
    : [];

  const home = competitors.find((team) => team.homeAway === "home");
  const away = competitors.find((team) => team.homeAway === "away");
  if (!home || !away) return null;

  const statusType = competition.status?.type || {};
  const state = statusType.state || "unknown";

  let category = "UNKNOWN";
  if (state === "pre") category = "UPCOMING";
  if (state === "in") category = "LIVE";
  if (state === "post" || statusType.completed === true) category = "FINAL";

  return {
    id: String(event.id),
    season: {
      year: event.season?.year ?? null,
      type: event.season?.type ?? null
    },
    week: event.week?.number ?? null,
    kickoffUtc: event.date ?? null,
    homeTeam: normalizeEspnTeam(home),
    awayTeam: normalizeEspnTeam(away),
    status: {
      category,
      state,
      name: statusType.name ?? null,
      description: statusType.description ?? null,
      completed: statusType.completed === true,
      clock: competition.status?.clock ?? null,
      displayClock: competition.status?.displayClock ?? null,
      period: competition.status?.period ?? null
    },
    venue: normalizeEspnVenue(competition.venue),
    neutralSite: competition.neutralSite === true
  };
}

function normalizeEspnTeam(competitor) {
  const team = competitor?.team || {};

  return {
    id: team.id ? String(team.id) : null,
    abbreviation: team.abbreviation ?? null,
    name: team.displayName ?? null,
    shortName: team.shortDisplayName ?? null,
    score: competitor?.score != null ? Number(competitor.score) : null
  };
}

function normalizeEspnVenue(venue) {
  if (!venue) return null;

  const address = venue.address || {};

  return {
    name: venue.fullName ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    country: address.country ?? null
  };
}

/**
 * Normalize a complete ESPN scoreboard response.
 */
function normalizeEspnScoreboard(data) {
  const events = Array.isArray(data?.events) ? data.events : [];
  return events.map(normalizeEspnGame).filter(Boolean);
}

/**
 * Build the scoreboard URL for a regular-season week.
 */
function buildEspnWeekUrl(week) {
  const params = new URLSearchParams({
    week: String(week),
    seasontype: "2"
  });
  return `${ESPN_SCOREBOARD_URL}?${params.toString()}`;
}

/**
 * Build the scoreboard URL for a calendar date (YYYYMMDD).
 */
function buildEspnDateUrl(date) {
  const params = new URLSearchParams({ dates: String(date) });
  return `${ESPN_SCOREBOARD_URL}?${params.toString()}`;
}

if (typeof window !== "undefined") {
  window.NFLGamesData = {
    ESPN_SCOREBOARD_URL,
    normalizeEspnGame,
    normalizeEspnTeam,
    normalizeEspnVenue,
    normalizeEspnScoreboard,
    buildEspnWeekUrl,
    buildEspnDateUrl
  };
}
