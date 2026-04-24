/**
 * js/dashboard.js
 * Loads and renders the user's saved resumes from Supabase.
 */

(async () => {
  // ── Auth guard — redirect to login if not logged in ──────────────────────
  const user = await window._auth.requireAuth();
  if (!user) return;

  // ── Populate nav user info ─────────────────────────────────────────────
  const emailEl  = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');
  const email    = user.email || '';
  const name     = user.user_metadata?.full_name || '';
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email[0]?.toUpperCase() || '?';

  emailEl.textContent  = name || email;
  avatarEl.textContent = initials;

  // ── Sign out button ────────────────────────────────────────────────────
  document.getElementById('signout-btn').addEventListener('click', () => {
    window._auth.signOut();
  });

  // ── Fetch resumes ──────────────────────────────────────────────────────
  let allResumes = [];

  async function loadResumes() {
    try {
      const res  = await window._auth.apiFetch('/api/resumes');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load resumes');

      allResumes = data.resumes || [];
      renderResumes(allResumes);
    } catch (err) {
      console.error('[dashboard] Error loading resumes:', err);
      showEmpty();
    }
  }

  // ── Render resume cards ────────────────────────────────────────────────
  function renderResumes(resumes) {
    const skeleton = document.getElementById('skeleton-grid');
    const grid     = document.getElementById('resume-grid');
    const empty    = document.getElementById('dash-empty');
    const stats    = document.getElementById('dash-stats');

    skeleton.style.display = 'none';

    if (resumes.length === 0) {
      showEmpty();
      return;
    }

    // Show stats
    stats.style.display   = 'flex';
    const scores = resumes.map(r => r.ats_score).filter(Boolean);
    const best   = scores.length ? Math.max(...scores) : null;

    document.getElementById('stat-total').textContent  = resumes.length;
    document.getElementById('stat-best').textContent   = best ? `${best}` : '—';
    document.getElementById('stat-latest').textContent = formatDate(resumes[0]?.created_at);

    // Render cards
    grid.innerHTML = resumes.map((r, idx) => buildCard(r, idx)).join('');
    grid.style.display = 'grid';
    empty.style.display = 'none';

  // Attach button events
    resumes.forEach(r => {
      // ── View / Preview ───────────────────────────────────────────────────
      const card = document.getElementById(`card-${r.id}`);
      if (card) {
        // Clicking the card body (not the action buttons) opens preview
        card.addEventListener('click', (e) => {
          if (e.target.closest('.resume-card-actions')) return;
          openPreview(r);
        });
      }
      document.getElementById(`view-${r.id}`)
        ?.addEventListener('click', (e) => { e.stopPropagation(); openPreview(r); });

      document.getElementById(`dl-docx-${r.id}`)
        ?.addEventListener('click', (e) => { e.stopPropagation(); downloadDocx(r); });
      document.getElementById(`dl-txt-${r.id}`)
        ?.addEventListener('click', (e) => { e.stopPropagation(); downloadTxt(r); });
      document.getElementById(`del-${r.id}`)
        ?.addEventListener('click', (e) => { e.stopPropagation(); confirmDelete(r.id); });
    });
  }

  function showEmpty() {
    document.getElementById('skeleton-grid').style.display = 'none';
    document.getElementById('resume-grid').style.display   = 'none';
    document.getElementById('dash-empty').style.display    = 'flex';
  }

  function buildCard(r, idx) {
    const score      = r.ats_score;
    const badgeClass = !score ? '' : score >= 85 ? '' : score >= 70 ? 'medium' : 'low';
    const badgeHtml  = score
      ? `<span class="ats-badge ${badgeClass}">ATS ${score}</span>` : '';

    const title = r.title || 'Untitled Resume';
    const date  = formatDate(r.created_at);
    const hasPreview = !!(r.resume_html);

    return `
      <div class="resume-card ${hasPreview ? 'has-preview' : ''}" id="card-${r.id}" style="animation-delay:${idx * 0.06}s" role="button" tabindex="0" aria-label="View ${escHtml(title)}">
        <div class="resume-card-header">
          <div class="resume-card-title">${escHtml(title)}</div>
          ${badgeHtml}
        </div>
        <div class="resume-card-meta">
          <span>${date}</span>
          ${hasPreview ? '<span class="preview-hint">Click to preview &#128065;</span>' : ''}
        </div>
        <div class="resume-card-actions">
          ${hasPreview ? `<button class="card-btn view" id="view-${r.id}">&#128065; View</button>` : ''}
          <button class="card-btn" id="dl-docx-${r.id}">&#128196; Word</button>
          <button class="card-btn" id="dl-txt-${r.id}">&#128203; ATS Text</button>
          <button class="card-btn danger" id="del-${r.id}">&#128465; Delete</button>
        </div>
      </div>
    `;
  }

  // ── Preview Modal ──────────────────────────────────────────────────────
  let _activeResume = null;

  function openPreview(r) {
    _activeResume = r;
    const overlay = document.getElementById('preview-overlay');
    document.getElementById('preview-title').textContent = r.title || 'Resume Preview';
    document.getElementById('preview-date').textContent  = formatDate(r.created_at);

    const content = document.getElementById('preview-resume-content');
    if (r.resume_html) {
      content.innerHTML = r.resume_html;
    } else if (r.plain_text) {
      content.innerHTML = `<pre style="white-space:pre-wrap;font-family:'Times New Roman',serif;font-size:10.5pt;line-height:1.4;color:#111">${escHtml(r.plain_text)}</pre>`;
    } else {
      content.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--text-muted)">No preview available for this resume.</div>`;
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Keyboard close
    document.addEventListener('keydown', handlePreviewKey);
  }

  function closePreview() {
    document.getElementById('preview-overlay').classList.remove('open');
    document.body.style.overflow = '';
    _activeResume = null;
    document.removeEventListener('keydown', handlePreviewKey);
  }

  function handlePreviewKey(e) {
    if (e.key === 'Escape') closePreview();
  }

  document.getElementById('preview-close').addEventListener('click', closePreview);

  // Close on overlay backdrop click
  document.getElementById('preview-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePreview();
  });

  // Preview PDF button
  document.getElementById('preview-pdf-btn').addEventListener('click', () => {
    if (!_activeResume?.resume_html) { alert('No HTML preview available for PDF download.'); return; }
    const name = _activeResume.title || 'Resume';
    let printFrame = document.getElementById('pdf-print-frame');
    if (printFrame) printFrame.remove();
    printFrame = document.createElement('iframe');
    printFrame.id = 'pdf-print-frame';
    printFrame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(printFrame);
    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;color:#000;padding:.6in .7in;font-size:10.5pt;line-height:1.25}
    .sh-header h1{font-size:20pt;font-weight:bold;text-align:center;margin-bottom:2px}.sh-contact{text-align:center;font-size:9.5pt;margin-bottom:4px}
    h2.sh-section-title{font-size:11pt;font-weight:bold;text-transform:uppercase;border-bottom:1.5px solid #000;padding-bottom:1px;margin-bottom:4px}
    .sh-bullets{list-style:disc;padding-left:22px}.sh-bullets li{font-size:10pt;margin-bottom:1px}
    @media print{body{padding:0}@page{margin:.5in .6in;size:A4}}</style>
    </head><body>${_activeResume.resume_html}</body></html>`);
    doc.close();
    setTimeout(() => { printFrame.contentWindow.focus(); printFrame.contentWindow.print(); setTimeout(() => printFrame.remove(), 3000); }, 400);
  });

  // Preview Word download
  document.getElementById('preview-docx-btn').addEventListener('click', () => {
    if (_activeResume) downloadDocx(_activeResume);
  });

  // Preview ATS Text download
  document.getElementById('preview-txt-btn').addEventListener('click', () => {
    if (_activeResume) downloadTxt(_activeResume);
  });



  // ── Download DOCX ──────────────────────────────────────────────────────
  async function downloadDocx(r) {
    try {
      const res = await window._auth.apiFetch('/api/resumes/download-docx', {
        method: 'POST',
        body: JSON.stringify({ resumeId: r.id }),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob     = await res.blob();
      const filename = `${(r.title || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      triggerDownload(blob, filename);
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  }

  // ── Download TXT ───────────────────────────────────────────────────────
  function downloadTxt(r) {
    if (!r.plain_text) { alert('No text version available for this resume.'); return; }
    const blob     = new Blob([r.plain_text], { type: 'text/plain' });
    const filename = `${(r.title || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_ATS.txt`;
    triggerDownload(blob, filename);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── Delete dialog ──────────────────────────────────────────────────────
  let pendingDeleteId = null;

  function confirmDelete(id) {
    pendingDeleteId = id;
    document.getElementById('delete-overlay').classList.add('open');
  }

  document.getElementById('delete-cancel').addEventListener('click', () => {
    pendingDeleteId = null;
    document.getElementById('delete-overlay').classList.remove('open');
  });

  document.getElementById('delete-confirm').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    document.getElementById('delete-overlay').classList.remove('open');
    pendingDeleteId = null;

    try {
      const res = await window._auth.apiFetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      allResumes = allResumes.filter(r => r.id !== id);
      renderResumes(allResumes);
    } catch (err) {
      alert('Failed to delete. Please try again.');
    }
  });

  // Close dialog on overlay click
  document.getElementById('delete-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      pendingDeleteId = null;
      e.currentTarget.classList.remove('open');
    }
  });

  // ── Utilities ──────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init ───────────────────────────────────────────────────────────────
  loadResumes();

})();
