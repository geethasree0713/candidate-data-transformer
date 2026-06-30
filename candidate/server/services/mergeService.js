// server/services/mergeService.js
const crypto = require("crypto");
const {
  normalizePhone,
  normalizeDateToYearMonth,
  normalizeLocation,
  normalizeSkillList,
} = require("../utils/normalize");

const TRUST = {
  csv: { identity: 0.9, other: 0.6 },
  resume: { identity: 0.6, other: 0.75 },
};

function makeCandidateId(email, fullName) {
  const seed = (email || fullName || "unknown").toLowerCase().trim();
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12);
}

function resolveSingleValue(fieldName, candidates) {
  const present = candidates.filter(c => c.value !== null && c.value !== undefined && c.value !== "");

  if (present.length === 0) {
    return { value: null, confidence: 0, provenance: null };
  }

  if (present.length === 1) {
    const only = present[0];
    return {
      value: only.value,
      confidence: only.trust,
      provenance: { field: fieldName, source: only.source, method: "single-source" },
    };
  }

  const normalized = present.map(p => String(p.value).toLowerCase().trim());
  const allAgree = normalized.every(v => v === normalized[0]);

  if (allAgree) {
    const winner = present.sort((a, b) => b.trust - a.trust)[0];
    return {
      value: winner.value,
      confidence: Math.min(0.99, winner.trust + 0.15),
      provenance: { field: fieldName, source: "multiple (agreed)", method: "agreement-boost" },
    };
  }

  const winner = present.sort((a, b) => b.trust - a.trust)[0];
  return {
    value: winner.value,
    confidence: Math.max(0.3, winner.trust - 0.2),
    provenance: {
      field: fieldName,
      source: winner.source,
      method: `conflict-resolved (won over: ${present.filter(p => p !== winner).map(p => p.source).join(", ")})`,
    },
  };
}

function resolveArrayValue(fieldName, candidates) {
  const seen = new Map();
  candidates.forEach(({ values, source }) => {
    (values || []).forEach(v => {
      if (!v) return;
      const key = String(v).toLowerCase().trim();
      if (!seen.has(key)) seen.set(key, { original: v, sources: [] });
      seen.get(key).sources.push(source);
    });
  });

  const merged = [...seen.values()].map(v => v.original);
  const provenance = {
    field: fieldName,
    source: [...new Set(candidates.map(c => c.source))].join("+"),
    method: "union-dedup",
  };
  return { value: merged, provenance };
}

function mergeSkills(resumeSkills) {
  const canon = normalizeSkillList(resumeSkills);
  return canon.map(name => ({
    name,
    confidence: 0.7,
    sources: ["resume"],
  }));
}

function mergeExperience(resumeExperience) {
  if (!Array.isArray(resumeExperience)) return [];
  return resumeExperience.map(exp => ({
    company: exp.company || exp.organization || null,
    title: exp.title || exp.role || null,
    start: normalizeDateToYearMonth(exp.start || exp.from),
    end: normalizeDateToYearMonth(exp.end || exp.to),
    summary: exp.summary || exp.description || null,
  }));
}

function mergeEducation(resumeEducation) {
  if (!Array.isArray(resumeEducation)) return [];
  return resumeEducation.map(ed => {
    const rawYear = ed.end_year || ed.year || null;
    const year = rawYear ? parseInt(String(rawYear).match(/\d{4}/)?.[0] || rawYear, 10) : null;
    return {
      institution: ed.institution || ed.school || null,
      degree: ed.degree || null,
      field: ed.field || ed.major || null,
      end_year: Number.isFinite(year) ? year : null,
    };
  });
}

function buildCanonicalProfile({ resumeData, recruiterRow }) {
  resumeData = resumeData || {};
  recruiterRow = recruiterRow || {};

  const provenanceLog = [];
  const pushProv = p => { if (p) provenanceLog.push(p); };

  const nameResolved = resolveSingleValue("full_name", [
    { value: recruiterRow.name || recruiterRow.full_name, source: "csv", trust: TRUST.csv.identity },
    { value: resumeData.full_name, source: "resume", trust: TRUST.resume.identity },
  ]);
  pushProv(nameResolved.provenance);

  const emailsResolved = resolveArrayValue("emails", [
    { values: recruiterRow.email ? [recruiterRow.email] : [], source: "csv", trust: TRUST.csv.identity },
    { values: resumeData.emails || [], source: "resume", trust: TRUST.resume.identity },
  ]);
  pushProv(emailsResolved.provenance);

  const rawPhonesCsv = recruiterRow.phone ? [recruiterRow.phone] : [];
  const rawPhonesResume = resumeData.phones || [];
  const phonesResolved = resolveArrayValue("phones", [
    { values: rawPhonesCsv, source: "csv", trust: TRUST.csv.identity },
    { values: rawPhonesResume, source: "resume", trust: TRUST.resume.identity },
  ]);
  const normalizedPhones = [...new Set(
    phonesResolved.value.map(normalizePhone).filter(Boolean)
  )];
  pushProv(phonesResolved.provenance);

  const location = normalizeLocation(resumeData.location);
  if (resumeData.location) {
    pushProv({ field: "location", source: "resume", method: "free-text-split" });
  }

  const headlineResolved = resolveSingleValue("headline", [
    { value: recruiterRow.title, source: "csv", trust: TRUST.csv.other },
    { value: resumeData.headline, source: "resume", trust: TRUST.resume.other },
  ]);
  pushProv(headlineResolved.provenance);

  const skills = mergeSkills(resumeData.skills);
  if (skills.length) {
    pushProv({ field: "skills", source: "resume", method: "extract+canonicalize" });
  }

  const experience = mergeExperience(resumeData.experience);
  const education = mergeEducation(resumeData.education);
  if (experience.length) pushProv({ field: "experience", source: "resume", method: "extract+normalize-dates" });
  if (education.length) pushProv({ field: "education", source: "resume", method: "extract" });

  const links = {
    linkedin: resumeData.linkedin || null,
    github: resumeData.github || null,
    portfolio: resumeData.portfolio || null,
    other: resumeData._otherLinks || [],
  };

  let years_experience = null;
  if (experience.length) {
    const starts = experience.map(e => e.start).filter(Boolean);
    if (starts.length) {
      const earliestYear = Math.min(...starts.map(s => parseInt(s.slice(0, 4), 10)));
      years_experience = new Date().getFullYear() - earliestYear;
    }
  }

  const fieldConfidences = [nameResolved.confidence, headlineResolved.confidence].filter(c => c > 0);
  const overall_confidence = fieldConfidences.length
    ? Number((fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length).toFixed(2))
    : 0;

  return {
    candidate_id: makeCandidateId(emailsResolved.value[0], nameResolved.value),
    full_name: nameResolved.value,
    emails: emailsResolved.value,
    phones: normalizedPhones,
    location,
    links,
    headline: headlineResolved.value,
    years_experience,
    skills,
    experience,
    education,
    provenance: provenanceLog,
    overall_confidence,
  };
}

module.exports = { buildCanonicalProfile };