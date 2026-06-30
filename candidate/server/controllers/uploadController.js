// server/controllers/uploadController.js
const { extractTextFromPDF, extractLinksFromPDF } = require("../services/pdfParser");
const { extractResumeData } = require("../services/aiService");
const { parseCSV } = require("../services/csvParser");
const { buildCanonicalProfile } = require("../services/mergeService");
const { projectProfile } = require("../services/projectionService");
const { compareSkills } = require("../services/matcherService");

const DEFAULT_CONFIG = {
  fields: [
    { path: "candidate_id", type: "string", required: true },
    { path: "full_name", type: "string", required: true },
    { path: "emails", type: "string[]" },
    { path: "phones", type: "string[]", normalize: "E164" },
    { path: "location.city", from: "location.city", type: "string" },
    { path: "location.region", from: "location.region", type: "string" },
    { path: "location.country", from: "location.country", type: "string" },
    { path: "links", type: "object" },
    { path: "headline", type: "string" },
    { path: "years_experience", type: "number" },
    { path: "skills", type: "object[]" },        // <-- full {name, confidence, sources[]} objects, matches the schema table
    { path: "experience", type: "object[]" },
    { path: "education", type: "object[]" },
  ],
  include_confidence: true,
  include_provenance: true,
  on_missing: "null",
};

const uploadFiles = async (req, res) => {
  try {
    const resumePath = req.files?.resume?.[0]?.path;
    const csvPath = req.files?.csv?.[0]?.path;

    let outputConfig = DEFAULT_CONFIG;
    if (req.body?.config) {
      try {
        outputConfig = JSON.parse(req.body.config);
      } catch {
        return res.status(400).json({ success: false, error: "config must be valid JSON" });
      }
    }

    let resumeData = null;
    if (resumePath) {
      try {
        const resumeText = await extractTextFromPDF(resumePath);
        const raw = await extractResumeData(resumeText);
        resumeData = JSON.parse(raw);

        // Fill in real hyperlink URLs from PDF annotations, overriding
        // any literal anchor-text the AI may have extracted (e.g. "LinkedIn").
        const realLinks = await extractLinksFromPDF(resumePath);
        resumeData.linkedin = realLinks.linkedin || null;
        resumeData.github = realLinks.github || null;
        resumeData.portfolio = realLinks.portfolio || null;
        resumeData._otherLinks = realLinks.other;
      } catch (err) {
        console.error("Resume extraction failed, degrading gracefully:", err.message);
        resumeData = null;
      }
    }

    const recruiterRow = csvPath ? await parseCSV(csvPath) : null;

    const canonicalProfile = buildCanonicalProfile({ resumeData, recruiterRow });

    const { result, errors } = projectProfile(canonicalProfile, outputConfig);

    if (errors.length && outputConfig.on_missing === "error") {
      return res.status(422).json({ success: false, errors });
    }

    const response = {
      success: true,
      profile: result
    };

    if (req.body?.targetSkills) {
      let targetSkills;
      try {
        targetSkills = JSON.parse(req.body.targetSkills);
      } catch {
        targetSkills = req.body.targetSkills;
      }
      response.fitScore = compareSkills(canonicalProfile.skills, targetSkills);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Upload pipeline error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  uploadFiles
};