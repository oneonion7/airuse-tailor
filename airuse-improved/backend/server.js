require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const generateRoute  = require('./routes/generate');
const parsePdfRoute  = require('./routes/parse-pdf');
const atsScoreRoute  = require('./routes/ats-score');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static frontend ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/generate',  generateRoute);
app.use('/api/parse-pdf', parsePdfRoute);
app.use('/api/ats-score', atsScoreRoute);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    version: '2.0.0',
  });
});

// ── Fallback ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  ResumeAI v2 running at http://localhost:${PORT}`);
  console.log(`🤖  Model  : ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
  console.log(`🔑  API Key: ${process.env.GROQ_API_KEY ? '✓ Set' : '✗ MISSING — set GROQ_API_KEY in .env'}\n`);
});
