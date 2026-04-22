require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const generateRoute  = require('./routes/generate');
const parsePdfRoute  = require('./routes/parse-pdf');
const atsScoreRoute  = require('./routes/ats-score');
const resumesRoute   = require('./routes/resumes');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers (helmet) ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc:    ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc:     ["'self'", "fonts.gstatic.com"],
      connectSrc:  ["'self'", "*.supabase.co", "api.groq.com"],
      imgSrc:      ["'self'", "data:"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,   // keeps PDF rendering working
}));

// ── CORS — allow localhost + any Vercel deployment ────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL, // optional: set a specific domain in Vercel env vars
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return cb(null, true);
    // Allow all Vercel preview and production deployments
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods:      ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs:        60 * 1000,   // 1 minute window
  max:             8,           // max 8 AI requests per IP per minute
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests — please wait a moment and try again.' },
});

// Apply to AI-heavy routes only
app.use('/api/generate',   aiLimiter);
app.use('/api/ats-score',  aiLimiter);

// ── Static frontend ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/generate',  generateRoute);
app.use('/api/parse-pdf', parsePdfRoute);
app.use('/api/ats-score', atsScoreRoute);
app.use('/api/resumes',   resumesRoute);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    model:     process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    version:   '3.0.0',
    supabase:  !!process.env.SUPABASE_URL,
  });
});

// ── Fallback — serve frontend for all non-API routes ───────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Export for Vercel serverless (MUST be before listen) ──────────────────
module.exports = app;

// ── Start (local dev only — Vercel ignores this) ───────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n✅  ResumeAI v3 running at http://localhost:${PORT}`);
    console.log(`🤖  Model  : ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
    console.log(`🔑  Groq   : ${process.env.GROQ_API_KEY ? '✓ Set' : '✗ MISSING'}`);
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? '✓ Set' : '✗ MISSING — set SUPABASE_URL in .env'}\n`);
  });
}
