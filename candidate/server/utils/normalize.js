const { canonicalSkillName } = require("./skillTaxonomy");

function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    digits = "+" + digits.slice(1).replace(/\D/g, "");
  } else {
    digits = digits.replace(/\D/g, "");
    if (digits.length === 10) {
      digits = "+91" + digits;
    } else if (digits.length > 10) {
      digits = "+" + digits;
    } else {
      return null;
    }
  }

  const isValid = /^\+\d{8,15}$/.test(digits);
  return isValid ? digits : null;
}

function normalizeDateToYearMonth(raw) {
  if (!raw) return null;
  const s = String(raw).trim();

  if (/present|current|ongoing/i.test(s)) return null;

  let m = s.match(/^(\d{4})-(\d{2})(-\d{2})?$/);
  if (m) return `${m[1]}-${m[2]}`;

  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  m = s.match(/([A-Za-z]{3,9})\.?\s+(\d{4})/);
  if (m) {
    const idx = months.indexOf(m[1].slice(0, 3).toLowerCase());
    if (idx >= 0) return `${m[2]}-${String(idx + 1).padStart(2, "0")}`;
  }

  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;

  m = s.match(/^(\d{4})$/);
  if (m) return `${m[1]}-01`;

  return null;
}

const COUNTRY_MAP = {
  "india": "IN",
  "united states": "US",
  "usa": "US",
  "united kingdom": "GB",
  "uk": "GB",
  "canada": "CA",
  "germany": "DE",
  "singapore": "SG",
};

// Indian states/UTs — if a region matches one of these and country wasn't
// stated explicitly, country=IN is a deterministic inference, not a guess.
const INDIAN_STATES = new Set([
  "karnataka","andhra pradesh","telangana","tamil nadu","kerala","maharashtra",
  "gujarat","rajasthan","punjab","haryana","uttar pradesh","bihar","west bengal",
  "odisha","madhya pradesh","delhi","goa","assam","jharkhand","chhattisgarh",
  "uttarakhand","himachal pradesh","tripura","manipur","meghalaya","nagaland",
  "mizoram","sikkim","arunachal pradesh",
]);

function normalizeCountry(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  return COUNTRY_MAP[key] || null;
}

function normalizeLocation(raw) {
  if (!raw) return { city: null, region: null, country: null };
  const parts = String(raw).split(",").map(p => p.trim()).filter(Boolean);

  let city = null, region = null, country = null;

  if (parts.length === 1) {
    city = parts[0];
  } else if (parts.length === 2) {
    const maybeCountry = normalizeCountry(parts[1]);
    if (maybeCountry) {
      city = parts[0];
      country = maybeCountry;
    } else {
      city = parts[0];
      region = parts[1];
    }
  } else {
    city = parts[0];
    region = parts[1] || null;
    country = normalizeCountry(parts[parts.length - 1]);
  }

  // Deterministic inference, not invention: a known Indian state name
  // unambiguously implies country=IN even if not spelled out.
  if (!country && region && INDIAN_STATES.has(region.toLowerCase())) {
    country = "IN";
  }

  return { city, region, country };
}

function normalizeSkillList(skills) {
  if (!skills) return [];
  const arr = Array.isArray(skills) ? skills : String(skills).split(/[;,]/);
  return [...new Set(
    arr.map(s => canonicalSkillName(String(s).trim())).filter(Boolean)
  )];
}

module.exports = {
  normalizePhone,
  normalizeDateToYearMonth,
  normalizeCountry,
  normalizeLocation,
  normalizeSkillList,
};