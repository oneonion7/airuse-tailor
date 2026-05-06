<div align="center">

# ✨ AirUse — AI-Powered ATS Resume Builder

**Generate job-tailored resumes that score 91+ on ATS scanners in seconds.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![Powered by Groq](https://img.shields.io/badge/Powered%20by-Groq%20AI-orange?logo=lightning&logoColor=white)](https://console.groq.com)
[![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[🌐 Live Demo](https://airuse.vercel.app) · [🐛 Report Bug](https://github.com/oneonion7/airuse-tailor/issues) · [💡 Request Feature](https://github.com/oneonion7/airuse-tailor/issues)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment-vercel)
- [How It Works](#-how-it-works)
- [v2 Improvements](#-v2-bug-fixes--improvements)
- [License](#-license)

---

## 🎯 About

**AirUse** is an AI-powered resume tailoring platform that takes your existing resume and a job description, then generates a highly-optimized, ATS-friendly resume — complete with verbatim keyword matching, metric-rich bullets, and a real-time ATS score breakdown.

> **Stop getting ghosted by ATS bots.** AirUse analyzes the job description, mirrors the exact keywords and title, and rewrites your resume to score 91+ on industry-standard ATS scanners like Jobscan and Resume Worded.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **91+ ATS Score** | Upgraded prompt engine with exact keyword matching, verbatim title mirroring, and metric-rich bullets |
| 📊 **Real-Time ATS Score Panel** | Live score breakdown with per-section analysis, missing keywords & quick wins |
| 🔦 **Keyword Highlighter** | Highlights job description keywords directly in the rendered resume |
| 📄 **PDF Resume Upload** | Upload existing resume PDF → AI auto-fills all form fields instantly |
| ⬇️ **PDF + Word Download** | Download your tailored resume as a print-ready PDF or `.docx` |
| ✉️ **AI Cover Letter** | Auto-generates a tailored cover letter matching the job description |
| 🔄 **One-Click Regenerate** | Regenerate with the same inputs for variation and experimentation |
| 🔐 **User Authentication** | Secure sign up / login via Supabase Auth |
| 📋 **Resume Dashboard** | Save, view, and manage all generated resumes from your account |
| 🔑 **API Key Rotation** | Supports multiple Groq API keys to stay within free-tier rate limits |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **Backend** | Express.js |
| **AI Model** | Groq API (Llama 3.3 70B) |
| **Auth & DB** | Supabase (PostgreSQL) |
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **PDF Parsing** | `pdf-parse` + Multer |
| **Word Export** | `docx` library |
| **Deployment** | Vercel |
| **Security** | Helmet, `express-rate-limit` |

---

## 📁 Project Structure

```
airuse/
├── backend/
│   ├── prompts/
│   │   ├── resumePrompt.js        ← ATS prompt engine (v2)
│   │   └── parseResumePrompt.js   ← PDF parsing prompt
│   ├── routes/
│   │   ├── generate.js            ← Resume + cover letter generation
│   │   ├── parse-pdf.js           ← PDF upload & parsing
│   │   └── ats-score.js           ← Real-time ATS scoring
│   ├── utils/
│   │   ├── groq.js                ← Groq SDK wrapper (with retry & key rotation)
│   │   ├── resumeRenderer.js      ← HTML resume renderer
│   │   └── docxGenerator.js       ← Word document generator
│   └── server.js
├── frontend/public/
│   ├── index.html                 ← Landing page
│   ├── login.html                 ← Auth: Login
│   ├── signup.html                ← Auth: Sign Up
│   ├── forgot-password.html       ← Auth: Password Reset
│   ├── builder.html               ← Resume builder interface
│   ├── dashboard.html             ← Saved resumes dashboard
│   ├── privacy.html
│   ├── terms.html
│   ├── css/                       ← Stylesheets
│   └── js/
│       ├── builder.js             ← Form logic + keyword highlighter
│       ├── renderer.js            ← Resume render + ATS score panel
│       └── pdfUpload.js           ← PDF drag & drop handler
├── .env.example                   ← Environment variable template
├── vercel.json                    ← Vercel deployment config
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **Groq API Key** (free) — [Get it here](https://console.groq.com)
- **Supabase Project** (free) — [Create one](https://supabase.com)

### Setup (3 steps)

```bash
# 1. Clone the repository
git clone https://github.com/oneonion7/airuse-tailor.git
cd airuse-tailor

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# → Open .env and fill in your API keys (see below)

# 4. Start the development server
npm run dev
# → Open http://localhost:3001
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# ── Groq API Keys (add multiple to enable key rotation) ──
GROQ_API_KEY=gsk_your_primary_key_here
GROQ_API_KEY_2=optional_second_key
GROQ_API_KEY_3=optional_third_key
GROQ_API_KEY_4=optional_fourth_key

# ── Model (optional) ──────────────────────────────────────
# Options: llama-3.3-70b-versatile | llama-3.1-70b-versatile | mixtral-8x7b-32768
GROQ_MODEL=llama-3.3-70b-versatile

# ── Server Port (optional) ────────────────────────────────
PORT=3001

# ── Supabase (Auth + Storage) ─────────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Primary Groq API key |
| `GROQ_API_KEY_2/3/4` | Optional | Additional keys for rate-limit rotation |
| `GROQ_MODEL` | Optional | Defaults to `llama-3.3-70b-versatile` |
| `PORT` | Optional | Defaults to `3001` |
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase service role key (server-side) |

> **Tip:** Add multiple `GROQ_API_KEY` variants to enable round-robin key rotation and stay within free-tier rate limits.

---

## ☁️ Deployment (Vercel)

This project is pre-configured for Vercel deployment via `vercel.json`.

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `./` (the repo root)
4. Add all environment variables from your `.env` file in the Vercel dashboard
5. Deploy 🚀

---

## ⚙️ How It Works

```
User Input
  │
  ├── Paste Job Description
  └── Upload Existing Resume (PDF) or fill form manually
        │
        ▼
  Groq AI (Llama 3.3 70B)
  ├── Extracts JD keywords & required skills
  ├── Mirrors job title verbatim
  ├── Rewrites bullets with quantified metrics
  └── Ensures keyword density across all sections
        │
        ▼
  Rendered Resume (HTML → PDF / DOCX)
  ├── Real-time ATS Score Panel
  ├── Keyword Highlighting
  └── One-click Download (PDF / Word)
```

---

## 🐛 v2 Bug Fixes & Improvements

### ATS Score: 46 → 91+

| What Changed | Impact |
|---|---|
| **Exact title matching** — Resume title mirrors JD verbatim | +15 ATS points |
| **Keyword density** — 15–25 JD keywords embedded across 2+ sections | Keyword coverage |
| **No keyword paraphrasing** — `React.js` stays `React.js` | Exact match scoring |
| **Metric-rich bullets** — 50%+ of bullets include a numeric result | Credibility & ATS |
| **Skills completeness** — Every JD skill listed verbatim in skills section | Full coverage |
| **`max_tokens` 4096 → 8000** | Richer, more complete output |
| **Temperature 0.2 → 0.15** | More deterministic, structured output |
| **Auto-retry with exponential backoff** | Resilience against rate limits |

### Parser
- Resume text limit increased from **3000 → 5000 chars** for better field extraction from dense PDFs

---

## 📜 License

MIT — free to use, modify, and distribute.

---

<div align="center">

Made with ❤️ by [oneonion7](https://github.com/oneonion7)

⭐ **If AirUse helped you land an interview, give it a star!**

</div>
