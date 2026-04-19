/**
 * js/pdfUpload.js
 * Handles PDF file selection + drag-and-drop, sends to backend for extraction
 * AND LLM-powered structured parsing to auto-fill every form field.
 */

(function () {
  const fileInput    = document.getElementById('f-resume-file');
  const uploadZone   = document.getElementById('upload-zone');
  const btnLabel     = document.getElementById('upload-btn-text');
  const expTextarea  = document.getElementById('f-experience');
  const fileInfoEl   = document.getElementById('upload-file-info');
  const fileNameEl   = document.getElementById('upload-file-name');

  if (!fileInput || !uploadZone) return;

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  ['dragenter', 'dragover'].forEach(event => {
    uploadZone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(event => {
    uploadZone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.remove('drag-over');
    });
  });

  uploadZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else {
      showToast('Please drop a PDF file.');
    }
  });

  // ── File input change ──────────────────────────────────────────────────────
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
  });

  // ── Process file ───────────────────────────────────────────────────────────
  async function processFile(file) {
    // Show file info
    if (fileInfoEl && fileNameEl) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      fileNameEl.textContent = `${file.name} (${sizeMB} MB)`;
      fileInfoEl.style.display = 'flex';
    }

    btnLabel.textContent = '⏳ Extracting & parsing resume…';

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body:   formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'PDF parsing failed');
      }

      // ── Auto-fill from structured LLM output ─────────────────────────────
      if (data.structured) {
        const s = data.structured;
        autoFill('f-name',      s.name);
        autoFill('f-role',      s.role);
        autoFill('f-email',     s.email);
        autoFill('f-phone',     s.phone);
        autoFill('f-city',      s.city);
        autoFill('f-linkedin',  s.linkedin);
        autoFill('f-experience', s.experience);
        autoFill('f-education',  s.education);
        autoFill('f-certs',      s.certifications);

        // Count how many fields were filled
        const fields = [s.name, s.role, s.email, s.phone, s.city, s.linkedin,
                        s.experience, s.education, s.certifications];
        const filled = fields.filter(v => v && String(v).trim()).length;

        btnLabel.textContent = `✅ Auto-filled ${filled} fields from ${data.pages} page(s)`;
        showToast(`Resume parsed! ${filled} fields auto-filled. Review & edit as needed.`, 'success');

        // Trigger progress bar update
        document.getElementById('f-name')?.dispatchEvent(new Event('input'));
        document.getElementById('f-experience')?.dispatchEvent(new Event('input'));
        document.getElementById('f-jd')?.dispatchEvent(new Event('input'));

        highlightFilledFields();
      } else {
        expTextarea.value = data.text;
        btnLabel.textContent = `✅ Extracted ${data.pages} page(s) — review & edit below`;
        showToast('Text extracted. LLM parsing was unavailable — fields not auto-filled.', 'error');
      }

      setTimeout(() => {
        btnLabel.textContent = 'Drop PDF resume here or click to browse';
      }, 5000);

    } catch (err) {
      console.error('[pdfUpload]', err);
      btnLabel.textContent = '❌ Failed — try pasting text manually';
      if (fileInfoEl) fileInfoEl.style.display = 'none';
      showToast(err.message || 'Could not parse PDF. Paste your resume text manually.');
      setTimeout(() => {
        btnLabel.textContent = 'Drop PDF resume here or click to browse';
      }, 3000);
    }

    // Reset input so same file can be re-selected
    fileInput.value = '';
  }

  // ── Auto-fill helper ───────────────────────────────────────────────────────
  function autoFill(fieldId, value) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const v = (value || '').trim();
    if (v) {
      el.value = v;
      // Trigger counter update
      el.dispatchEvent(new Event('input'));
    }
  }

  // ── Highlight filled fields ────────────────────────────────────────────────
  function highlightFilledFields() {
    const ids = ['f-name', 'f-role', 'f-email', 'f-phone', 'f-city',
                 'f-linkedin', 'f-experience', 'f-education', 'f-certs'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.value.trim()) {
        el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
        el.style.boxShadow  = '0 0 0 3px rgba(124, 58, 237, 0.3)';
        el.style.borderColor = 'var(--accent)';
        setTimeout(() => {
          el.style.boxShadow  = '';
          el.style.borderColor = '';
        }, 2500);
      }
    });
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(msg, type = 'error') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id        = 'global-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = `toast ${type === 'success' ? 'success' : ''}`;
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  }
})();
