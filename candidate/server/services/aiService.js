const Groq = require("groq-sdk");
const cleanJSON = require("../utils/cleanJson");

const extractResumeData = async (resumeText) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `
You are an AI Resume Parser.

Extract information from the resume below and return ONLY valid JSON matching
EXACTLY this shape and these field names (do not rename or add extra keys):

{
  "full_name": "",
  "emails": [],
  "phones": [],
  "headline": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "skills": [],
  "education": [
    { "institution": "", "degree": "", "field": "", "end_year": null }
  ],
  "experience": [
    { "company": "", "title": "", "start": "", "end": "", "summary": "" }
  ]
}

Rules:
- "start" and "end" should be the raw date text as written on the resume (e.g. "May 2024", "2023", "Present"). Do not reformat them yourself.
- "end" should be the literal string "Present" if the role is current/ongoing.
- "headline" is the candidate's current/most recent job title or a one-line professional summary if no title is stated.
- If a field is not present in the resume, use null (for strings) or [] (for arrays). Never invent values.
- Do not include markdown, comments, or any text outside the JSON object.

Resume:

${resumeText}
`;

    const response = await groq.chat.completions.create({
      model: process.env.MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
    });

    let content = response.choices[0].message.content;

    return cleanJSON(content);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  extractResumeData,
};