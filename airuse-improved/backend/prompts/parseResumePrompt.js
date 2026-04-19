/**
 * prompts/parseResumePrompt.js — v2
 * Improved: preserves more detail from experience/projects for better tailoring
 */

const PARSE_RESUME_SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL structured data from the raw resume text.
Output ONLY a valid JSON object. No backticks. No explanation. No markdown. Just JSON.

Use this exact structure:
{
  "name": "Full Name",
  "role": "Most recent job title or current role",
  "email": "email@example.com",
  "phone": "+1 234 567 8900",
  "city": "City, Country",
  "linkedin": "linkedin URL or path",
  "experience": "Complete work history, internships, projects, and achievements. Preserve ALL details: company names, dates, technologies used, metrics, accomplishments. Keep bullet points and structure.",
  "education": "All degrees, institutions, dates, GPA/CGPA, relevant coursework",
  "certifications": "All certifications, online courses, awards, publications"
}

Critical rules:
- Extract EVERY piece of information — do not summarize or truncate
- For experience: preserve all tech stack mentions, metrics (%, numbers), project names, and accomplishments
- If a field is not found, use empty string ""
- Start response with { and end with }`;

function buildParseResumePrompt(resumeText) {
  // Keep under 3000 chars to stay within free-tier TPM limits
  const trimmed = resumeText.length > 3000 ? resumeText.slice(0, 3000) : resumeText;
  return `Parse this resume and extract ALL structured data.

RESUME TEXT:
${trimmed}

Output JSON only. Preserve ALL details. Start with {`;
}

module.exports = { PARSE_RESUME_SYSTEM_PROMPT, buildParseResumePrompt };
