// GitHub Actions script: NFL season predictions ("Tips") fetched from a
// published Google Sheet (CSV export).
//
// Új Form-struktúra:
//   A oszlop: Időbélyeg
//   B oszlop: Neved
//   C-tól kezdve: 32 oszlop, egy-egy csapat neve, értéke a tippelt
//                 győzelmek száma (0-17). A vereséget a szkript számolja:
//                 vereség = 17 - győzelem

import { writeFile } from "fs/promises";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRaYJdD7mK1jS-v3y4FHDguRZVNDvQ7oJz14_wMiAESKpCZ6uLy9NaiPr9ftmxWFDbYplGyaIO8B3U-/pub?output=csv";

// Minimal, robust CSV parser that supports quoted fields (commas/newlines
// inside quotes), which is how Google Sheets exports CSV.
function parseCsv(text) {
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    var next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char === "\r") {
        // ignore, handled by \n
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(function (r) {
    return r.some(function (c) { return c.trim() !== ""; });
  });
}

function isTimestampOrNameHeader(h) {
  var lower = h.trim().toLowerCase();
  return (
    lower.indexOf("időbélyeg") !== -1 ||
    lower.indexOf("timestamp") !== -1 ||
    lower.indexOf("neved") !== -1 ||
    lower.indexOf("name") !== -1
  );
}

async function main() {
  console.log("Fetching predictions from Google Sheet...");
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error("Failed to fetch CSV: HTTP " + res.status);
  }
  const text = await res.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    console.log("No rows found.");
    await writeFile(
      "tips.json",
      JSON.stringify({ updated_at: new Date().toISOString(), predictors: [] }, null, 2)
    );
    return;
  }

  const header = rows[0];
  const nameIdx = header.findIndex(function (h) {
    var lower = h.trim().toLowerCase();
    return lower.indexOf("neved") !== -1 || lower.indexOf("name") !== -1;
  });

  if (nameIdx === -1) {
    throw new Error("Could not find the 'Neved' column in the header row.");
  }

  // Every column that isn't the timestamp or the name column is treated as
  // a team column: header text = team name, cell value = predicted wins.
  const teamColumns = [];
  header.forEach(function (h, idx) {
    if (idx === nameIdx) return;
    if (isTimestampOrNameHeader(h)) return;
    var teamName = h.trim();
    if (!teamName) return;
    teamColumns.push({ index: idx, team: teamName });
  });

  console.log("Detected " + teamColumns.length + " team columns.");

  const dataRows = rows.slice(1);

  // Keep only the latest submission per name (later rows overwrite earlier
  // ones for the same person, since Sheet rows are chronological).
  const byName = {};

  dataRows.forEach(function (r) {
    const name = (r[nameIdx] || "").trim();
    if (!name) return;

    const picks = [];

    teamColumns.forEach(function (col) {
      const raw = (r[col.index] || "").trim();
      if (raw === "") return;

      const wins = parseInt(raw, 10);
      if (isNaN(wins) || wins < 0 || wins > 17) return;

      const losses = 17 - wins;
      picks.push({ team: col.team, prediction: wins + "-" + losses });
    });

    if (picks.length > 0) {
      byName[name] = picks;
    }
  });

  const predictors = Object.keys(byName)
    .sort(function (a, b) { return a.localeCompare(b); })
    .map(function (name) {
      return { name: name, picks: byName[name] };
    });

  const output = {
    updated_at: new Date().toISOString(),
    predictors: predictors,
  };

  await writeFile("tips.json", JSON.stringify(output, null, 2));
  console.log("Done. Saved " + predictors.length + " predictors to tips.json.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
