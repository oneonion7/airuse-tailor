/**
 * routes/generate.js — v2
 * POST /api/generate          — resume JSON + cover letter
 * POST /api/generate/download-docx — .docx download
 */

const express = require('express');
const router  = express.Router();
const { callLLMJSON, callLLM } = require('../utils/groq');
const { renderResumeHTML }     = require('../utils/resumeRenderer');
const { generateDocx }         = require('../utils/docxGenerator');
const {
  RESUME_SYSTEM_PROMPT, COVER_SYSTEM_PROMPT,
  buildResumePrompt, buildCoverPrompt,
} = require('../prompts/resumePrompt');

let lastResumeData = null;
let lastResumeInfo = null;
let lastResumePlainText = null;

// ── Generate Resume ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, role, email, phone, city, linkedin, experience, education, certifications, jobDescription } = req.body;

  if (!name || !experience || !jobDescription) {
    return res.status(400).json({ error: 'Missing required fields: name, experience, jobDescription' });
  }

  try {
    console.log(`[generate] Step 1/2 — Generating resume JSON for: ${name}`);
    const resumePrompt = buildResumePrompt({ name, email, phone, city, linkedin, experience, education, certifications, jobDescription });
    const parsed = await callLLMJSON(RESUME_SYSTEM_PROMPT, resumePrompt);

    console.log(`[generate] Step 2/2 — Generating cover letter`);
    const coverPrompt = buildCoverPrompt({ name, city, experience, jobDescription });
    const coverText   = await callLLM(COVER_SYSTEM_PROMPT, coverPrompt);

    const info = { name, role, email, phone, city, linkedin };
    const resumeHTML = renderResumeHTML(parsed, info);

    const coverLetterHTML = coverText
      .split('\n')
      .filter(line => line.trim())
      .map(p => `<p style="margin-bottom:1rem;font-family:Arial,sans-serif;font-size:10.5pt">${p}</p>`)
      .join('');

    // Build ATS-optimized plain text version (used for scoring + txt download)
    const r = parsed.resume || parsed;
    const lines = [];

    // Header
    lines.push((info.name || '').toUpperCase());
    const contact = [
      info.email ? `Email: ${info.email}` : '',
      info.phone ? `Phone: ${info.phone}` : '',
      info.city  ? info.city : '',
      info.linkedin ? `LinkedIn: ${info.linkedin}` : '',
    ].filter(Boolean).join(' | ');
    if (contact) lines.push(contact);
    lines.push('');

    // Summary
    if (r.summary) {
      lines.push('SUMMARY');
      lines.push(r.summary);
      lines.push('');
    }

    // Work Experience
    if ((r.experience || []).length > 0) {
      lines.push('WORK EXPERIENCE');
      for (const j of r.experience) {
        lines.push(`${j.title || ''}${j.company ? ` | ${j.company}` : ''}${j.location ? ` | ${j.location}` : ''}${j.dates ? ` | ${j.dates}` : ''}`);
        for (const b of (j.bullets || [])) lines.push(`• ${b}`);
        lines.push('');
      }
    }

    // Projects
    if ((r.projects || []).length > 0) {
      lines.push('PROJECTS');
      for (const p of r.projects) {
        lines.push(p.name || '');
        for (const b of (p.bullets || [])) lines.push(`• ${b}`);
        lines.push('');
      }
    }

    // Skills
    if ((r.skills || []).length > 0) {
      lines.push('SKILLS');
      for (const s of r.skills) lines.push(`${s.category}: ${s.items}`);
      lines.push('');
    }

    // Education
    if ((r.education || []).length > 0) {
      lines.push('EDUCATION');
      for (const e of r.education) {
        lines.push(`${e.degree || ''}${e.institution ? ` | ${e.institution}` : ''}${e.dates ? ` | ${e.dates}` : ''}`);
        if (e.details) lines.push(e.details);
      }
      lines.push('');
    }

    // Certifications
    if ((r.certifications || []).length > 0) {
      lines.push('CERTIFICATIONS');
      for (const c of r.certifications) {
        lines.push(typeof c === 'string' ? c : `${c.name}${c.issuer ? ` | ${c.issuer}` : ''}`);
      }
      lines.push('');
    }

    lastResumePlainText = lines.join('\n');
    lastResumeData = parsed;
    lastResumeInfo = info;

    const tailoring = r.tailoring || null;

    console.log(`[generate] Done ✓`);
    res.json({ success: true, resumeHTML, coverLetterHTML, tailoring, resumePlainText: lastResumePlainText });

  } catch (err) {
    console.error('[generate] Error:', err.message);
    res.status(500).json({ error: err.message || 'Generation failed. Check your Groq API key.' });
  }
});

// ── Download as Plain Text ────────────────────────────────────────────────────
router.post('/download-txt', async (req, res) => {
  try {
    if (!lastResumePlainText || !lastResumeInfo) {
      return res.status(400).json({ error: 'No resume data available. Generate a resume first.' });
    }
    const filename = `${(lastResumeInfo.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume_ATS.txt`;
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(lastResumePlainText);
    console.log(`[download-txt] Sent ${filename}`);
  } catch (err) {
    console.error('[download-txt] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate text file.' });
  }
});

// ── Download as Word Document ─────────────────────────────────────────────────
router.post('/download-docx', async (req, res) => {
  try {
    if (!lastResumeData || !lastResumeInfo) {
      return res.status(400).json({ error: 'No resume data available. Generate a resume first.' });
    }

    const buffer = await generateDocx(lastResumeData, lastResumeInfo);
    const filename = `${(lastResumeInfo.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume.docx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
    console.log(`[download-docx] Sent ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('[download-docx] Error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate Word document.' });
  }
});

module.exports = router;

