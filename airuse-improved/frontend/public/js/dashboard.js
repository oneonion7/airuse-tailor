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
      document.getElementById(`dl-docx-${r.id}`)
        ?.addEventListener('click', () => downloadDocx(r));
      document.getElementById(`dl-txt-${r.id}`)
        ?.addEventListener('click', () => downloadTxt(r));
      document.getElementById(`del-${r.id}`)
        ?.addEventListener('click', () => confirmDelete(r.id));
    });
  }

  function showEmpty() {
    document.getElementById('skeleton-grid').style.display = 'none';
    document.getElementById('resume-grid').style.display   = 'none';
    document.getElementById('dash-empty').style.display    = 'flex';
  }

  function buildCard(r, idx) {
    const score     = r.ats_score;
    const badgeClass = !score ? '' : score >= 85 ? '' : score >= 70 ? 'medium' : 'low';
    const badgeText  = score ? `ATS ${score}` : '';
    const badgeHtml  = score
      ? `<span class="ats-badge ${badgeClass}">${badgeText}</span>`
      : '';

    const title = r.title || 'Untitled Resume';
    const date  = formatDate(r.created_at);

    return `
      <div class="resume-card" style="animation-delay:${idx * 0.06}s">
        <div class="resume-card-header">
          <div class="resume-card-title">${escHtml(title)}</div>
          ${badgeHtml}
        </div>
        <div class="resume-card-meta">
          <span>${date}</span>
        </div>
        <div class="resume-card-actions">
          <button class="card-btn" id="dl-docx-${r.id}">📄 Word</button>
          <button class="card-btn" id="dl-txt-${r.id}">📋 ATS Text</button>
          <button class="card-btn danger" id="del-${r.id}">🗑 Delete</button>
        </div>
      </div>
    `;
  }

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
