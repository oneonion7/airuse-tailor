/**
 * js/builder.js
 * Core form logic: validation, calling the backend /api/generate,
 * wiring up buttons, progress bar, character counters, and toasts.
 */

(function () {
  // ── DOM refs ───────────────────────────────────────────────────────────────
  const generateBtn  = document.getElementById('generate-btn');
  const spinner      = document.getElementById('spinner');
  const btnText      = document.getElementById('btn-text');
  const statusBar    = document.getElementById('status-bar');
  const statusText   = document.getElementById('status-text');
  const outputEmpty  = document.getElementById('output-empty');
  const downloadBtn  = document.getElementById('download-btn');
  const regenBtn     = document.getElementById('regen-btn');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel= document.getElementById('progress-label');

  // ── Tracked fields for progress bar ────────────────────────────────────────
  const trackedFields = ['f-name', 'f-experience', 'f-jd'];

  // ── Status messages that cycle during generation ───────────────────────────
  const statusMessages = [
    'AI is analyzing your experience…',
    'Matching keywords to job description…',
    'Structuring ATS-optimized sections…',
    'Generating professional summary…',
    'Crafting tailored bullet points…',
    'Building cover letter…',
    'Almost done — final polish…',
  ];

  // ── Init ───────────────────────────────────────────────────────────────────
  generateBtn.addEventListener('click', generate);
  regenBtn.addEventListener('click',    generate);
  downloadBtn.addEventListener('click', () => {
    const name = document.getElementById('f-name').value.trim();
    window.ResumeRenderer.downloadPDF(name);
  });

  // Word document download
  const docxBtn = document.getElementById('download-docx-btn');
  if (docxBtn) {
    docxBtn.addEventListener('click', async () => {
      docxBtn.textContent = '⏳ Generating…';
      docxBtn.disabled = true;
      try {
        const res = await fetch('/api/generate/download-docx', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Download failed');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const name = document.getElementById('f-name').value.trim() || 'Resume';
        a.href = url;
        a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Word document downloaded!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to download Word document.');
      } finally {
        docxBtn.textContent = '📄 Download Word';
        docxBtn.disabled = false;
      }
    });
  }

  // Plain-text ATS download (best parse rate for ATS tools)
  const txtBtn = document.getElementById('download-txt-btn');
  if (txtBtn) {
    txtBtn.addEventListener('click', async () => {
      txtBtn.textContent = '⏳ Preparing…';
      txtBtn.disabled = true;
      try {
        const res = await fetch('/api/generate/download-txt', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Download failed');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const name = document.getElementById('f-name').value.trim() || 'Resume';
        a.href = url;
        a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume_ATS.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('ATS text file downloaded! Use this when uploading to job portals.', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to download text file.');
      } finally {
        txtBtn.textContent = '📋 Download ATS Text';
        txtBtn.disabled = false;
      }
    });
  }


  // Progress bar updates
  trackedFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateProgress);
    }
  });
  updateProgress();

  // Character counters
  document.querySelectorAll('[data-counter]').forEach(textarea => {
    const counterId = textarea.getAttribute('data-counter');
    const counterEl = document.getElementById(counterId);
    if (counterEl) {
      const updateCount = () => {
        const len = textarea.value.length;
        counterEl.textContent = len > 0 ? `${len} chars` : '';
      };
      textarea.addEventListener('input', updateCount);
      updateCount();
    }
  });

  // ── Progress Bar ───────────────────────────────────────────────────────────
  function updateProgress() {
    const filled = trackedFields.filter(id => {
      const el = document.getElementById(id);
      return el && el.value.trim().length > 0;
    }).length;
    const total = trackedFields.length;
    const pct = Math.round((filled / total) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${filled} / ${total} required`;
  }

  // ── Main Generate Flow ─────────────────────────────────────────────────────
  let statusInterval = null;

  async function generate() {
    const name        = val('f-name');
    const role        = val('f-role');
    const email       = val('f-email');
    const phone       = val('f-phone');
    const city        = val('f-city');
    const linkedin    = val('f-linkedin');
    const experience  = val('f-experience');
    const education   = val('f-education');
    const certs       = val('f-certs');
    const jd          = val('f-jd');

    // Validation
    if (!name || !experience || !jd) {
      showToast('Please provide your Name, Experience/Projects, and the Target Job Description.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name, role, email, phone, city, linkedin,
          experience, education, certifications: certs,
          jobDescription: jd,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed. Check server logs.');
      }

      window.ResumeRenderer.render(data.resumeHTML, data.coverLetterHTML || null, data.tailoring || null, data.resumePlainText || null);
      showToast('Resume generated successfully!', 'success');

    } catch (err) {
      console.error('[builder] generate error:', err);

      outputEmpty.style.display = 'flex';
      outputEmpty.querySelector('h3').textContent = 'Something went wrong';
      outputEmpty.querySelector('p').textContent  = err.message || 'Unexpected error. Check the console.';

      showToast(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function val(id) {
    return (document.getElementById(id)?.value || '').trim();
  }

  function setLoading(loading) {
    generateBtn.disabled          = loading;
    spinner.style.display         = loading ? 'block' : 'none';
    btnText.textContent           = loading ? 'AI is working…' : 'Generate Tailored Resume →';
    statusBar.className           = loading ? 'status-bar show' : 'status-bar';

    if (loading) {
      generateBtn.classList.add('loading');

      // Hide previous results
      document.getElementById('resume-output').style.display      = 'none';
      document.getElementById('cover-letter-output').style.display = 'none';
      document.getElementById('output-actions').style.display      = 'none';
      document.getElementById('tailoring-report').style.display    = 'none';
      outputEmpty.style.display = 'none';

      // Cycle through status messages
      let msgIndex = 0;
      statusText.textContent = statusMessages[0];
      statusInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % statusMessages.length;
        statusText.textContent = statusMessages[msgIndex];
      }, 3000);
    } else {
      generateBtn.classList.remove('loading');
      if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
      }
    }
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type = 'error') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = Object.assign(document.createElement('div'), {
        id:        'global-toast',
        className: 'toast',
      });
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = `toast${type === 'success' ? ' success' : ''}`;
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  }

  // Expose for external use
  window.BuilderApp = { generate, showToast };
})();

// ── Keyword Highlighter ────────────────────────────────────────────────────
(function () {
  const toggleBtn = document.getElementById('highlight-keywords-btn');
  if (!toggleBtn) return;

  let highlightOn = false;

  toggleBtn.addEventListener('click', () => {
    highlightOn = !highlightOn;
    toggleBtn.textContent = highlightOn ? '🔦 Hide Highlights' : '🔦 Highlight Keywords';
    toggleBtn.classList.toggle('active', highlightOn);

    const resumeEl = document.getElementById('resume-output');
    if (!resumeEl) return;

    if (highlightOn) {
      const jd = (document.getElementById('f-jd')?.value || '').toLowerCase();
      // Extract words 4+ chars from JD as keywords
      const keywords = [...new Set(
        jd.match(/\b[a-z][a-z0-9+#.\-]{3,}\b/g) || []
      )].filter(w => !STOPWORDS.has(w)).slice(0, 60);

      highlightInElement(resumeEl, keywords);
    } else {
      // Remove all highlights
      resumeEl.querySelectorAll('mark.kw-highlight').forEach(mark => {
        mark.replaceWith(document.createTextNode(mark.textContent));
      });
      // Re-normalize text nodes
      resumeEl.normalize();
    }
  });

  function highlightInElement(el, keywords) {
    if (!keywords.length) return;
    const pattern = new RegExp(`\\b(${keywords.map(escapeRE).join('|')})\\b`, 'gi');

    walkTextNodes(el, node => {
      const text = node.textContent;
      if (!pattern.test(text)) return;
      pattern.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0, match;
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) {
          frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        }
        const mark = document.createElement('mark');
        mark.className = 'kw-highlight';
        mark.textContent = match[0];
        frag.appendChild(mark);
        last = pattern.lastIndex;
      }
      if (last < text.length) {
        frag.appendChild(document.createTextNode(text.slice(last)));
      }
      node.parentNode.replaceChild(frag, node);
    });
  }

  function walkTextNodes(root, cb) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentNode.nodeName === 'MARK' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(cb);
  }

  function escapeRE(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const STOPWORDS = new Set([
    'that','this','with','from','have','will','your','been','they',
    'their','there','about','which','would','could','should','into',
    'more','also','some','than','when','then','what','were','each',
    'work','team','good','best','high','both','year','able','make',
    'time','using','used','must','need','well'
  ]);
})();
