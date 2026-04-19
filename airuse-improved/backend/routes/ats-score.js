/**
 * routes/ats-score.js
 * POST /api/ats-score
 * Scores a generated resume against the job description and returns
 * a detailed ATS breakdown with improvement suggestions.
 * NEW FEATURE — v2
 */

const express = require('express');
const router  = express.Router();
const { callLLMJSON } = require('../utils/groq');

const ATS_SCORE_SYSTEM = `You are an ATS (Applicant Tracking System) scoring expert. Analyze a resume against a job description and return a detailed score breakdown. Output ONLY valid JSON. No backticks. No markdown. Just JSON.

Return this exact structure:
{
  "overall_score": 91,
  "grade": "A",
  "sections": {
    "keyword_match": { "score": 22, "max": 25, "found": ["keyword1","keyword2"], "missing": ["missing1"] },
    "title_match":   { "score": 14, "max": 15, "matched": true, "jd_title": "...", "resume_title": "..." },
    "skills_coverage": { "score": 18, "max": 20, "found": ["skill1"], "missing": ["skill2"] },
    "summary_quality": { "score": 13, "max": 15, "keyword_count": 7, "issues": [] },
    "bullet_quality":  { "score": 14, "max": 15, "with_metrics": 4, "total": 6, "issues": [] },
    "format":          { "score": 9, "max": 10, "issues": [] }
  },
  "top_missing_keywords": ["keyword1", "keyword2", "keyword3"],
  "quick_wins": ["Add 'Docker' to your skills section", "Add a metric to bullet 3"],
  "summary": "One sentence summary of the score"
}`;

router.post('/', async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'resumeText and jobDescription are required.' });
  }

  try {
    const prompt = `Score this resume against the job description for ATS compatibility.

JOB DESCRIPTION:
${String(jobDescription).slice(0, 2500)}

RESUME CONTENT:
${String(resumeText).slice(0, 3000)}

Provide a detailed ATS score breakdown. Be strict — a score of 90+ means the resume has:
- Exact title match from JD
- 15+ JD keywords used verbatim across multiple sections
- Every JD skill listed in skills section
- 50%+ bullets with metrics
- 3-4 sentence keyword-rich summary

Output JSON only. Start with {`;

    const result = await callLLMJSON(ATS_SCORE_SYSTEM, prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[ats-score] Error:', err.message);
    res.status(500).json({ error: err.message || 'ATS scoring failed.' });
  }
});

module.exports = router;
