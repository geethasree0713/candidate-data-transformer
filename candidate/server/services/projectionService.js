// server/services/projectionService.js
const { normalizePhone, normalizeSkillList } = require("../utils/normalize");

function getNested(obj, path) {
  if (!path) return obj;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

function getByPath(obj, path) {
  if (path.includes("[].")) {
    const [arrPath, subPath] = path.split("[].");
    const base = arrPath ? getNested(obj, arrPath) : obj;
    if (!Array.isArray(base)) return [];
    return base.map(item => getNested(item, subPath));
  }
  return getNested(obj, path);
}

function applyNormalization(value, normalizeType) {
  if (value === null || value === undefined) return value;
  switch (normalizeType) {
    case "E164":
      return Array.isArray(value)
        ? value.map(normalizePhone).filter(Boolean)
        : normalizePhone(value);
    case "canonical":
      return Array.isArray(value) ? normalizeSkillList(value) : value;
    default:
      return value;
  }
}

function setByOutputPath(target, outPath, value) {
  const parts = outPath.split(".");
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function validateField(path, type, value, required) {
  if (value === null || value === undefined) {
    if (required) return { valid: false, error: `${path} is required but missing` };
    return { valid: true };
  }
  const checks = {
    string: v => typeof v === "string",
    number: v => typeof v === "number" && !Number.isNaN(v),
    boolean: v => typeof v === "boolean",
    "string[]": v => Array.isArray(v) && v.every(x => typeof x === "string"),
  };
  const check = checks[type];
  if (check && !check(value)) {
    return { valid: false, error: `${path} expected type ${type}, got ${JSON.stringify(value)}` };
  }
  return { valid: true };
}

function projectProfile(canonicalProfile, config) {
  if (!config || !Array.isArray(config.fields)) {
    throw new Error("Invalid projection config: 'fields' array is required");
  }

  const onMissing = config.on_missing || "null";
  const result = {};
  const errors = [];

  for (const fieldDef of config.fields) {
    const sourcePath = fieldDef.from || fieldDef.path;
    let value = getByPath(canonicalProfile, sourcePath);
    if (value === undefined) value = null;

    if (fieldDef.normalize) {
      value = applyNormalization(value, fieldDef.normalize);
    }

    const validation = validateField(fieldDef.path, fieldDef.type, value, fieldDef.required);
    if (!validation.valid) {
      if (onMissing === "error" || fieldDef.required) {
        errors.push(validation.error);
        continue;
      }
    }

    const isEmpty = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      if (onMissing === "omit") continue;
      if (onMissing === "error" && fieldDef.required) {
        errors.push(`${fieldDef.path} is required but missing`);
        continue;
      }
      setByOutputPath(result, fieldDef.path, null);
      continue;
    }

    setByOutputPath(result, fieldDef.path, value);
  }

  if (config.include_confidence) {
    result.overall_confidence = canonicalProfile.overall_confidence;
  }
  if (config.include_provenance) {
    result.provenance = canonicalProfile.provenance;
  }

  return { result, errors };
}

module.exports = { projectProfile };