// server/utils/skillTaxonomy.js
// Maps common aliases/casings to one canonical skill name.
const ALIASES = {
  "js": "javascript",
  "javascript": "javascript",
  "java script": "javascript",
  "ts": "typescript",
  "typescript": "typescript",
  "reactjs": "react",
  "react.js": "react",
  "react": "react",
  "nodejs": "node.js",
  "node": "node.js",
  "node.js": "node.js",
  "py": "python",
  "python": "python",
  "html5": "html",
  "html": "html",
  "css3": "css",
  "css": "css",
  "postgres": "postgresql",
  "postgresql": "postgresql",
  "genai": "generative ai",
  "generative ai": "generative ai",
  "gen ai": "generative ai",
  "ml": "machine learning",
  "machine learning": "machine learning",
  "scikit learn": "scikit-learn",
  "scikit-learn": "scikit-learn",
  "sklearn": "scikit-learn",
};

function canonicalSkillName(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (!key) return null;
  return ALIASES[key] || key;
}

module.exports = { canonicalSkillName, ALIASES };