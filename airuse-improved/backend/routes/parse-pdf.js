/**
 * routes/parse-pdf.js
 * POST /api/parse-pdf  (multipart/form-data, field name: "pdf")
 * Accepts a PDF file upload, extracts plain text, then uses Groq LLM to
 * parse it into structured resume fields for auto-filling the form.
 */

const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const pdfParse   = require('pdf-parse');
const { callLLMJSON }    = require('../utils/groq');
const {
  PARSE_RESUME_SYSTEM_PROMPT,
  buildParseResumePrompt,
} = require('../prompts/parseResumePrompt');

// Store uploaded files in memory (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'), false);
    }
  },
});

router.post('/', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file received.' });
  }

  try {
    const data = await pdfParse(req.file.buffer);

    // Clean up the extracted text
    const cleaned = data.text
      .replace(/\r\n/g, '\n')       // normalise line endings
      .replace(/\n{3,}/g, '\n\n')   // collapse excessive blank lines
      .trim();

    // ── LLM-powered structured extraction ──────────────────────────────────
    let structured = null;
    try {
      console.log('[parse-pdf] Extracting structured fields via Groq LLM…');
      const prompt = buildParseResumePrompt(cleaned);
      structured = await callLLMJSON(PARSE_RESUME_SYSTEM_PROMPT, prompt);
      console.log('[parse-pdf] Structured extraction complete ✓');
    } catch (llmErr) {
      // LLM extraction failed — fall back to raw text only
      console.warn('[parse-pdf] LLM extraction failed, falling back to raw text:', llmErr.message);
    }

    res.json({
      success: true,
      text: cleaned,
      pages: data.numpages,
      structured: structured, // null if LLM failed, object otherwise
    });
  } catch (err) {
    console.error('[parse-pdf] Error:', err.message);
    res.status(500).json({
      error: 'Failed to parse PDF. Make sure it is a text-based PDF (not a scanned image).',
    });
  }
});

module.exports = router;
