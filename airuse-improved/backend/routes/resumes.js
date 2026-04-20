/**
 * routes/resumes.js
 * Authenticated CRUD routes for saved resumes.
 *
 * GET    /api/resumes            — list user's resumes (newest first)
 * POST   /api/resumes            — save a new resume
 * DELETE /api/resumes/:id        — delete a resume
 * POST   /api/resumes/download-docx — re-download a resume as .docx
 */

const express  = require('express');
const router   = express.Router();
const { requireAuth, supabaseAdmin } = require('../middleware/auth');
const { generateDocx } = require('../utils/docxGenerator');

// ── GET /api/resumes — list resumes for the logged-in user ─────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('id, title, ats_score, plain_text, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, resumes: data });
  } catch (err) {
    console.error('[resumes] GET error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to load resumes.' });
  }
});

// ── POST /api/resumes — save a new resume ───────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { title, resume_data, resume_html, cover_html, plain_text, ats_score } = req.body;

  if (!resume_html && !plain_text) {
    return res.status(400).json({ error: 'resume_html or plain_text is required.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id:     req.user.id,
        title:       title       || 'Untitled Resume',
        resume_data: resume_data || null,
        resume_html: resume_html || null,
        cover_html:  cover_html  || null,
        plain_text:  plain_text  || null,
        ats_score:   ats_score   || null,
      })
      .select('id, title, created_at')
      .single();

    if (error) throw error;

    console.log(`[resumes] Saved resume "${data.title}" for user ${req.user.id}`);
    res.json({ success: true, resume: data });
  } catch (err) {
    console.error('[resumes] POST error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to save resume.' });
  }
});

// ── DELETE /api/resumes/:id — delete a resume ──────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);   // ensures users can only delete their own

    if (error) throw error;

    console.log(`[resumes] Deleted resume ${id} for user ${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[resumes] DELETE error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to delete resume.' });
  }
});

// ── POST /api/resumes/download-docx — re-download a saved resume as .docx ──
router.post('/download-docx', requireAuth, async (req, res) => {
  const { resumeId, resumeData, resumeInfo } = req.body;

  let data   = resumeData;
  let info   = resumeInfo;
  let title  = 'Resume';

  // If resumeId is provided, fetch from DB
  if (resumeId) {
    try {
      const { data: row, error } = await supabaseAdmin
        .from('resumes')
        .select('resume_data, title')
        .eq('id', resumeId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !row) {
        return res.status(404).json({ error: 'Resume not found.' });
      }
      data  = row.resume_data;
      title = row.title || title;
      info  = {};   // docxGenerator uses data.resume for names
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch resume.' });
    }
  }

  if (!data) {
    return res.status(400).json({ error: 'resumeData or resumeId is required.' });
  }

  try {
    const buffer   = await generateDocx(data, info || {});
    const filename = `${(title || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume.docx`;

    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      buffer.length,
    });
    res.send(buffer);
    console.log(`[resumes] DOCX sent: ${filename}`);
  } catch (err) {
    console.error('[resumes] DOCX error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate Word document.' });
  }
});

module.exports = router;
