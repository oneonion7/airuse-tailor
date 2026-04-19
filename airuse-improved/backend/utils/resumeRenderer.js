/**
 * utils/resumeRenderer.js
 * Renders resume JSON into ATS-friendly HTML matching the 92-score reference format.
 *
 * Format reference (92 ATS score):
 *  - Header: Name (large), contact on one line: email | P:phone | linkedin
 *  - PROFILE SUMMARY — full paragraph
 *  - PROJECT EXPERIENCE — bold project name sub-heading + bullets
 *  - TECHNICAL SKILLS — bullet list, bold category: items
 *  - EDUCATION — degree, university, CGPA on separate lines
 *  - CERTIFICATION — bullet list
 */

function renderResumeHTML(data, info) {
  const r = data.resume || data;

  // ── Contact line: email | P:phone | linkedin ────────────────────────────────
  const contactParts = [];
  if (info.email)    contactParts.push(`Email: ${escHtml(info.email)}`);
  if (info.phone)    contactParts.push(`Phone: ${escHtml(info.phone)}`);
  if (info.city)     contactParts.push(escHtml(info.city));
  if (info.linkedin) {
    const display = info.linkedin.replace(/^https?:\/\//, '').replace(/^www\./, '');
    contactParts.push(`LinkedIn: ${escHtml(display)}`);
  }
  const contactStr = contactParts.join(' | ');

  const role = info.role || r.title || '';

  // ── Experience / Work ───────────────────────────────────────────────────────
  const hasWorkExp = r.experience && r.experience.length > 0;
  const expHtml = (r.experience || []).map(job => {
    const headerParts = [];
    if (job.dates) headerParts.push(`<span class="sh-job-dates">${escHtml(job.dates)}</span>`);
    const rightSide = [];
    if (job.company) rightSide.push(`<span class="sh-job-company">${escHtml(job.company)}</span>`);

    return `
    <div class="sh-job">
      <div class="sh-job-header">
        <span class="sh-job-title">${escHtml(job.title || '')}${job.company ? `, <em>${escHtml(job.company)}</em>` : ''}${job.location ? ` — ${escHtml(job.location)}` : ''}</span>
        ${job.dates ? `<span class="sh-job-dates">${escHtml(job.dates)}</span>` : ''}
      </div>
      <ul class="sh-bullets">
        ${(job.bullets || []).map(b => `<li>${escHtml(b)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');

  // ── Projects (bold sub-heading style like reference) ────────────────────────
  const projectsArr = r.projects || [];
  const projectsHtml = projectsArr.map(proj => `
    <div class="sh-project">
      <div class="sh-project-name">${escHtml(proj.name || '').toUpperCase()}</div>
      <ul class="sh-bullets">
        ${(proj.bullets || []).map(b => `<li>${escHtml(b)}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  // ── Skills (bullet list with bold category) ─────────────────────────────────
  const skillsHtml = (r.skills || []).map(s => `
    <li><strong>${escHtml(s.category || 'Skills')}:</strong> ${escHtml(s.items || '')}</li>
  `).join('');

  // ── Education (multi-line format) ───────────────────────────────────────────
  const eduHtml = (r.education || []).map(e => {
    const lines = [];
    if (e.degree)      lines.push(`<strong>${escHtml(e.degree)}</strong>`);
    const uniParts = [];
    if (e.institution) uniParts.push(escHtml(e.institution));
    if (e.dates)       uniParts.push(`(${escHtml(e.dates)})`);
    if (uniParts.length) lines.push(uniParts.join(' '));
    if (e.details)     lines.push(escHtml(e.details));
    return `<div class="sh-edu-item">${lines.join('<br>')}</div>`;
  }).join('');

  // ── Certifications (bullet list) ────────────────────────────────────────────
  const certsArr = r.certifications || [];
  const certsHtml = certsArr.map(c => {
    if (typeof c === 'string') return `<li><strong>${escHtml(c)}</strong></li>`;
    const parts = [];
    if (c.name)   parts.push(`<strong>${escHtml(c.name)}</strong>`);
    if (c.issuer) parts.push(escHtml(c.issuer));
    if (c.date)   parts.push(escHtml(c.date));
    return `<li>${parts.join(' | ')}</li>`;
  }).join('');

  // ── Assemble (matching 92-score reference format) ───────────────────────────
  return `
    <div class="sh-header">
      <h1>${escHtml(info.name)}</h1>
      <div class="sh-contact">${contactStr}</div>
    </div>

    ${r.summary ? `
    <div class="sh-section">
      <h2 class="sh-section-title">SUMMARY</h2>
      <p class="sh-summary">${escHtml(r.summary)}</p>
    </div>` : ''}

    ${hasWorkExp ? `
    <div class="sh-section">
      <h2 class="sh-section-title">WORK EXPERIENCE</h2>
      ${expHtml}
    </div>` : ''}

    ${projectsHtml ? `
    <div class="sh-section">
      <h2 class="sh-section-title">PROJECTS</h2>
      ${projectsHtml}
    </div>` : ''}

    ${skillsHtml ? `
    <div class="sh-section">
      <h2 class="sh-section-title">SKILLS</h2>
      <ul class="sh-skill-list">
        ${skillsHtml}
      </ul>
    </div>` : ''}

    ${eduHtml ? `
    <div class="sh-section">
      <h2 class="sh-section-title">EDUCATION</h2>
      ${eduHtml}
    </div>` : ''}

    ${certsHtml ? `
    <div class="sh-section">
      <h2 class="sh-section-title">CERTIFICATIONS</h2>
      <ul class="sh-bullets">
        ${certsHtml}
      </ul>
    </div>` : ''}
  `.trim();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { renderResumeHTML };
