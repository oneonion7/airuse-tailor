/**
 * js/renderer.js â€” v2
 * Renders resume HTML, PDF download, tailoring report,
 * and the NEW real ATS score panel.
 */

window.ResumeRenderer = (function () {

  let _lastResumePlainText = '';
  let _lastJobDescription  = '';

  function render(resumeHTML, coverHTML, tailoring, resumePlainText) {
    const resumeEl = document.getElementById('resume-output');
    const coverEl  = document.getElementById('cover-letter-output');

    _lastResumePlainText = resumePlainText || '';
    _lastJobDescription  = (document.getElementById('f-jd')?.value || '').trim();

    resumeEl.innerHTML     = resumeHTML;
    resumeEl.style.display = 'block';
    resumeEl.classList.add('resume-reveal');

    if (coverHTML) {
      coverEl.innerHTML      = `<div class="cover-letter-title">Cover Letter</div>${coverHTML}`;
      coverEl.style.display  = 'block';
      coverEl.classList.add('resume-reveal');
    } else {
      coverEl.style.display = 'none';
    }

    document.getElementById('output-empty').style.display   = 'none';
    document.getElementById('output-actions').style.display = 'flex';

    renderTailoringReport(tailoring, resumeHTML);

    // Trigger real ATS score if we have both resume text and JD
    if (_lastResumePlainText && _lastJobDescription) {
      fetchATSScore(_lastResumePlainText, _lastJobDescription);
    }

    resumeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      resumeEl.classList.remove('resume-reveal');
      if (coverEl) coverEl.classList.remove('resume-reveal');
    }, 700);
  }

  // â”€â”€ Real ATS Score Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function fetchATSScore(resumeText, jobDescription) {
    const atsPanel = document.getElementById('ats-score-panel');
    if (!atsPanel) return;

    // Show loading state
    atsPanel.innerHTML = `
      <div class="ats-loading">
        <div class="ats-spinner"></div>
        <span>Calculating ATS scoreâ€¦</span>
      </div>`;
    atsPanel.style.display = 'block';

    try {
      const res = await fetch('/api/ats-score', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ATS scoring failed');
      renderATSPanel(data);
    } catch (err) {
      atsPanel.innerHTML = `<div class="ats-error">âš ï¸ ATS scoring unavailable: ${esc(err.message)}</div>`;
    }
  }

  function renderATSPanel(d) {
    const atsPanel = document.getElementById('ats-score-panel');
    if (!atsPanel) return;

    const score = d.overall_score || 0;
    const grade = d.grade || gradeFromScore(score);
    const color = score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#ef4444';
    const arc   = circumference(score);

    const sections = d.sections || {};
    const sectionRows = Object.entries(sections).map(([key, s]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const pct   = s.max ? Math.round((s.score / s.max) * 100) : 0;
      const col   = pct >= 85 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
      return `
        <div class="ats-row">
          <span class="ats-row-label">${label}</span>
          <div class="ats-bar-wrap">
            <div class="ats-bar-fill" style="width:${pct}%;background:${col}"></div>
          </div>
          <span class="ats-row-score" style="color:${col}">${s.score}/${s.max}</span>
        </div>`;
    }).join('');

    const missing  = (d.top_missing_keywords || []).slice(0, 6);
    const quickWins = (d.quick_wins || []).slice(0, 4);

    atsPanel.innerHTML = `
      <div class="ats-header">
        <h3>ðŸŽ¯ ATS Score Analysis</h3>
        <p class="ats-sub">${esc(d.summary || 'Resume scored against job description')}</p>
      </div>

      <div class="ats-score-row">
        <div class="ats-donut-wrap">
          <svg viewBox="0 0 100 100" class="ats-donut">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ats-track)" stroke-width="10"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="${color}" stroke-width="10"
              stroke-dasharray="${arc.filled} ${arc.total}"
              stroke-dashoffset="${arc.offset}"
              stroke-linecap="round"/>
            <text x="50" y="44" text-anchor="middle" fill="${color}" font-size="20" font-weight="bold">${score}</text>
            <text x="50" y="58" text-anchor="middle" fill="var(--ats-label)" font-size="10">${grade}</text>
          </svg>
        </div>
        <div class="ats-breakdown">
          ${sectionRows}
        </div>
      </div>

      ${missing.length ? `
      <div class="ats-missing">
        <h4>âš ï¸ Missing Keywords</h4>
        <div class="ats-tags">
          ${missing.map(k => `<span class="ats-tag missing">${esc(k)}</span>`).join('')}
        </div>
      </div>` : ''}

      ${quickWins.length ? `
      <div class="ats-wins">
        <h4>âš¡ Quick Wins</h4>
        <ul>${quickWins.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
      </div>` : ''}
    `;
    atsPanel.style.display = 'block';
  }

  function circumference(score) {
    const r = 42;
    const total = 2 * Math.PI * r;
    const filled = (score / 100) * total;
    return { total: total.toFixed(1), filled: filled.toFixed(1), offset: (total / 4).toFixed(1) };
  }

  function gradeFromScore(s) {
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    return 'D';
  }

  // â”€â”€ Tailoring Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function renderTailoringReport(tailoring, resumeHTML) {
    const reportEl = document.getElementById('tailoring-report');
    if (!reportEl) return;
    if (!tailoring) { reportEl.style.display = 'none'; return; }

    const html  = resumeHTML.toLowerCase();
    const sections = [
      { name: 'Profile Summary',    present: html.includes('profile summary') },
      { name: 'Work Experience',    present: html.includes('work experience') },
      { name: 'Project Experience', present: html.includes('project experience') },
      { name: 'Technical Skills',   present: html.includes('technical skills') },
      { name: 'Education',          present: html.includes('education') },
      { name: 'Certification',      present: html.includes('certification') },
    ];
    const presentCount = sections.filter(s => s.present).length;

    const scoreEl = document.getElementById('score-value');
    if (scoreEl) scoreEl.textContent = `${presentCount}/${sections.length}`;

    const checklistEl = document.getElementById('ats-checklist');
    if (checklistEl) {
      checklistEl.innerHTML = sections.map(s => `
        <div class="checklist-item ${s.present ? 'pass' : 'fail'}">
          <span class="check-icon">${s.present ? 'âœ…' : 'âŒ'}</span>
          <span>${s.name}</span>
        </div>`).join('');
    }

    const keywordTags = document.getElementById('keyword-tags');
    if (keywordTags) {
      const keywords = tailoring.keywords_integrated || tailoring.keywords_added || [];
      keywordTags.innerHTML = keywords
        .map(kw => `<span class="keyword-tag">${esc(kw)}</span>`)
        .join('');
    }

    const changesList = document.getElementById('changes-list');
    if (changesList) {
      const changes = tailoring.changes || [];
      changesList.innerHTML = changes.map(c => `<li>${esc(c)}</li>`).join('');
    }

    reportEl.style.display = 'block';
  }

  // â”€â”€ PDF Download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function downloadPDF(candidateName) {
    const resumeEl = document.getElementById('resume-output');
    if (!resumeEl || resumeEl.style.display === 'none' || !resumeEl.innerHTML.trim()) {
      alert('Please generate your resume first before downloading.');
      return;
    }

    const name    = candidateName || 'Resume';
    const content = resumeEl.innerHTML;

    // Use iframe (never blocked by popup blockers, works on all browsers)
    let printFrame = document.getElementById('pdf-print-frame');
    if (printFrame) printFrame.remove();

    printFrame = document.createElement('iframe');
    printFrame.id = 'pdf-print-frame';
    printFrame.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(name)} - ATS Resume</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #000;
      padding: 0.6in 0.7in;
      font-size: 10.5pt;
      line-height: 1.25;
    }
    .sh-header { margin-bottom: 4px; }
    .sh-header h1 { font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 2px; }
    .sh-contact { text-align: center; font-size: 9.5pt; margin-bottom: 4px; }
    .sh-section { margin-bottom: 6px; }
    h2.sh-section-title {
      font-size: 11pt; font-weight: bold; text-transform: uppercase;
      border-bottom: 1.5px solid #000; padding-bottom: 1px; margin-bottom: 4px;
    }
    .sh-summary { font-size: 10.5pt; text-align: justify; line-height: 1.3; margin-bottom: 2px; }
    .sh-job { margin-bottom: 4px; }
    .sh-job-header { display:flex; justify-content:space-between; flex-wrap:wrap; gap:2px; margin-bottom:1px; }
    .sh-job-title { font-weight: bold; font-size: 10.5pt; }
    .sh-job-dates { font-weight: bold; font-size: 10pt; white-space: nowrap; }
    .sh-project { margin-bottom: 4px; }
    .sh-project-name { font-weight: bold; font-size: 10.5pt; margin-bottom: 1px; }
    .sh-bullets { list-style-type: disc; padding-left: 22px; margin-top: 1px; }
    .sh-bullets li { font-size: 10pt; margin-bottom: 1px; line-height: 1.25; text-align: justify; }
    .sh-skill-list { list-style-type: disc; padding-left: 22px; }
    .sh-skill-list li { font-size: 10pt; margin-bottom: 1px; line-height: 1.3; }
    .sh-edu-item { margin-bottom: 3px; font-size: 10.5pt; line-height: 1.3; }
    @media print {
      body { padding: 0; }
      @page { margin: 0.5in 0.6in; size: A4; }
    }
  </style>
</head>
<body>${content}</body>
</html>`);
    doc.close();

    // Give the iframe a moment to render, then print
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        alert('Could not open print dialog. Please try again or use Ctrl+P after the resume appears.');
      }
      // Clean up after print dialog closes
      setTimeout(() => { if (printFrame) printFrame.remove(); }, 3000);
    }, 400);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;');
  }

  return { render, downloadPDF, fetchATSScore };
})();
