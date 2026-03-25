#!/usr/bin/env node
// Generate data/hsr_matrix.json from timetable-like JSON input.
//
// Expected loose input shape:
// [
//   {
//     "from": "上海虹桥",
//     "to": "南京南",
//     "fromId": "SHH",
//     "toId": "NJN",
//     "durationMinutes": 73
//   }
// ]
//
// Usage:
//   node scripts/gen_hsr_matrix.js input.json data/hsr_matrix.json

const fs = require("fs");
const path = require("path");

const [, , inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error("Usage: node scripts/gen_hsr_matrix.js <input.json> <output.json>");
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
}

function writeJson(file, data) {
  const full = path.resolve(file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function main() {
  const rows = readJson(inputFile);
  if (!Array.isArray(rows)) {
    throw new Error("Input must be a JSON array");
  }

  const matrix = {};
  for (const row of rows) {
    const fromId = String(row.fromId || "").trim();
    const toId = String(row.toId || "").trim();
    const duration = toInt(row.durationMinutes);
    if (!fromId || !toId || !duration) continue;

    const key = `${fromId}_${toId}`;
    if (!matrix[key] || duration < matrix[key]) {
      matrix[key] = duration;
    }
  }

  writeJson(outputFile, matrix);
  console.log(`Generated ${Object.keys(matrix).length} HSR pairs -> ${path.resolve(outputFile)}`);
}

main();
