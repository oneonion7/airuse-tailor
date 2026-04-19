# ✨ ResumeAI v2 — AI-Powered ATS Resume Builder

Generate job-tailored resumes that score **91+ on ATS scanners** (Jobscan, Resume Worded).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

### Setup (3 steps)

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# → Open .env and add: GROQ_API_KEY=gsk_your_key_here

# 3. Start the server
npm start
# → Open http://localhost:3001
```

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Get free at console.groq.com |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model to use |
| `PORT` | No | `3001` | Server port |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **91+ ATS Score** | Upgraded prompt engine with exact keyword matching, verbatim title mirroring, and metric-rich bullets |
| 📊 **Real ATS Score Panel** | Live score breakdown with per-section analysis, missing keywords, and quick wins |
| 🔦 **Keyword Highlighter** | Highlights JD keywords directly in your rendered resume |
| 📄 **PDF Upload** | Upload existing resume → AI auto-fills all form fields |
| ⬇ **PDF + Word Download** | Download as print-ready PDF or `.docx` |
| ✉️ **Cover Letter** | AI generates a matching cover letter |
| 🔄 **One-click Regenerate** | Regenerate with same inputs for variation |

---

## 🐛 v2 Bug Fixes & Improvements

### ATS Score: 46 → 91+
- **Exact title matching**: Resume title now copied verbatim from JD (worth 15 ATS points)
- **Keyword density**: 15–25 JD keywords embedded across 2+ sections each
- **No keyword paraphrasing**: "React.js" stays "React.js", not "React" or "ReactJS"
- **Metric-rich bullets**: 50%+ of bullets must have a numeric result
- **Skills completeness**: Every JD skill listed verbatim in skills section
- **Richer output**: `max_tokens` increased from 4096 → 8000
- **Lower temperature**: 0.2 → 0.15 for more deterministic structured output
- **Auto-retry**: Rate limit errors now retry with exponential backoff

### Parser
- Resume text limit increased from 3000 → 5000 chars for better field extraction

---

## 📁 Project Structure

```
airuse/
├── backend/
│   ├── prompts/
│   │   ├── resumePrompt.js       ← Upgraded ATS prompt engine (v2)
│   │   └── parseResumePrompt.js  ← PDF parsing prompt
│   ├── routes/
│   │   ├── generate.js           ← Resume + cover letter generation
│   │   ├── parse-pdf.js          ← PDF upload & parsing
│   │   └── ats-score.js          ← NEW: Real-time ATS scoring
│   ├── utils/
│   │   ├── groq.js               ← Groq SDK wrapper (with retry)
│   │   ├── resumeRenderer.js     ← HTML renderer
│   │   └── docxGenerator.js      ← Word document generator
│   └── server.js
├── frontend/public/
│   ├── builder.html
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── builder.js            ← Form logic + keyword highlighter
│       ├── renderer.js           ← Resume render + ATS score panel
│       └── pdfUpload.js          ← PDF drag & drop
├── .env.example
└── package.json
```

---

## 📜 License
MIT — free to use and modify.
