// server/services/csvParser.js
const fs = require("fs");
const csv = require("csv-parser");

const HEADER_MAP = {
  "name": "name",
  "full name": "name",
  "full_name": "name",
  "email": "email",
  "e-mail": "email",
  "phone": "phone",
  "phone number": "phone",
  "current_company": "current_company",
  "current company": "current_company",
  "company": "current_company",
  "title": "title",
  "job title": "title",
};

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = HEADER_MAP[key.trim().toLowerCase()] || key.trim().toLowerCase();
    out[normalizedKey] = typeof value === "string" ? value.trim() : value;
  }
  return out;
}

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath || !fs.existsSync(filePath)) {
      return resolve(null);
    }

    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(normalizeRow(data));
      })
      .on("end", () => {
        resolve(results.length > 0 ? results[0] : null);
      })
      .on("error", (err) => {
        console.error("CSV parse error:", err.message);
        resolve(null);
      });
  });
};

module.exports = {
  parseCSV,
};