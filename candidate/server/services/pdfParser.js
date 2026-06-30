const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

const extractTextFromPDF = async (filePath) => {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      text += pageText + "\n";
    }

    return text;
  } catch (error) {
    console.error("PDF Parser Error:", error);
    throw error;
  }
};

/**
 * PDF.js text extraction only returns visible text, not hyperlink URLs —
 * a resume showing "LinkedIn | GitHub" as link labels loses the actual
 * href entirely. This reads page annotations (where real URLs live) and
 * pattern-matches them into linkedin/github/portfolio buckets.
 */
const extractLinksFromPDF = async (filePath) => {
  const links = { linkedin: null, github: null, portfolio: null, other: [] };

  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();

      for (const a of annotations) {
        const url = a.url || a.unsafeUrl;
        if (!url) continue;

        const lower = url.toLowerCase();

        // mailto:/tel: links are contact methods, not web profiles —
        // exclude them entirely rather than misfiling one as "portfolio".
        if (lower.startsWith("mailto:") || lower.startsWith("tel:")) {
          continue;
        }

        if (lower.includes("linkedin.com")) {
          links.linkedin = links.linkedin || url;
        } else if (lower.includes("github.com")) {
          links.github = links.github || url;
        } else if (lower.includes("leetcode.com") || lower.includes("hackerrank.com")) {
          links.other.push(url);
        } else {
          // Unknown domain — treat first unmatched as portfolio, rest as other
          if (!links.portfolio) links.portfolio = url;
          else links.other.push(url);
        }
      }
    }
  } catch (error) {
    console.error("PDF Link Extraction Error:", error.message);
    // degrade gracefully — links stay null, never crash the run
  }

  return links;
};

module.exports = {
  extractTextFromPDF,
  extractLinksFromPDF,
};