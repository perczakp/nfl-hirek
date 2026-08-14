// GitHub Actions script: NFL season predictions ("Tips") fetched from a
// published Google Sheet (CSV export). No API key needed.

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

  return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ""; }); });
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
    await writeFile("tips.json", JSON.stringify({ updated_at: new Date().toISOString(), predictors: [] }, null, 2));
    return;
  }

  const header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
  const nameIdx = header.findIndex(function (h) { return h.indexOf("neved") !== -1 || h.indexOf("name") !== -1; });
  const teamIdx = header.findIndex(function (h) { return h.indexOf("csapat") !== -1 || h.indexOf("team") !== -1; });
  const predictionIdx = header.findIndex(function (h) { return h.indexOf("eredm") !== -1 || h.indexOf("predict") !== -1; });
  const timestampIdx = header.findIndex(function (h) { return h.indexOf("id\u0151b") !== -1 || h.indexOf("timestamp") !== -1; });

  const dataRows = rows.slice(1);

  const grouped = {};

  dataRows.forEach(function (r) {
    const name = (nameIdx !== -1 ? r[nameIdx] : "").trim();
    const team = (teamIdx !== -1 ? r[teamIdx] : "").trim();
    const prediction = (predictionIdx !== -1 ? r[predictionIdx] : "").trim();
    const timestamp = (timestampIdx !== -1 ? r[timestampIdx] : "").trim();

    if (!name || !team || !prediction) return;

    if (!grouped[name]) grouped[name] = [];
    grouped[name].push({ team: team, prediction: prediction, timestamp: timestamp || null });
  });

  const predictors = Object.keys(grouped)
    .sort(function (a, b) { return a.localeCompare(b); })
    .map(function (name) {
      return { name: name, picks: grouped[name] };
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
