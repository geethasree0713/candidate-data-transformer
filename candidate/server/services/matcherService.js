// server/services/matcherService.js
const { canonicalSkillName } = require("../utils/skillTaxonomy");

function compareSkills(canonicalSkills, targetSkills) {
  if (!canonicalSkills || !targetSkills) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      message: "Candidate skills or target skills missing."
    };
  }

  let candidateSkills = [];
  if (Array.isArray(canonicalSkills)) {
    candidateSkills = canonicalSkills
      .map(skill => canonicalSkillName(String(typeof skill === "string" ? skill : skill.name)))
      .filter(Boolean);
  }

  let targetList = [];
  if (Array.isArray(targetSkills)) {
    targetList = targetSkills.map(skill => canonicalSkillName(String(skill).trim())).filter(Boolean);
  } else if (typeof targetSkills === "string") {
    targetList = targetSkills
      .split(/[;,]/)
      .map(skill => canonicalSkillName(skill.trim()))
      .filter(Boolean);
  }

  targetList = [...new Set(targetList)];
  const candidateSet = new Set(candidateSkills);

  const matchedSkills = targetList.filter(skill => candidateSet.has(skill));
  const missingSkills = targetList.filter(skill => !candidateSet.has(skill));
  const score = targetList.length > 0
    ? Math.round((matchedSkills.length / targetList.length) * 100)
    : 0;

  return { score, matchedSkills, missingSkills };
}

module.exports = {
  compareSkills
};