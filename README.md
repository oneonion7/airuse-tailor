# AirUse — AI-Powered ATS Resume Builder

Monorepo for **ResumeAI** (tailoresumeai.xyz) — generate job-tailored, ATS-optimized resumes in seconds.

| Directory | Description |
|---|---|
| [`airuse-improved/`](airuse-improved/) | Web app — Express backend + frontend (v4 design system). See its README for setup. |
| [`airuse_flutter/`](airuse_flutter/) | Flutter app (iOS / Android / Web) |

## Frontend v4 rebuild

The web frontend was rebuilt on a single design system:

- `css/app.css` — design tokens (dark/light themes), shared components (buttons, forms, nav, toast, modals)
- `css/landing.css`, `css/auth.css`, `css/builder.css`, `css/dashboard.css` — page styles
- All backend API contracts, Supabase auth flows, and JS logic (`builder.js`, `renderer.js`, `dashboard.js`, `pdfUpload.js`) unchanged

Quick start:

```bash
cd airuse-improved
npm install
cp .env.example .env   # add GROQ_API_KEY + Supabase keys
npm run dev            # http://localhost:3001
```
