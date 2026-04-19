/**
 * utils/groq.js — v2
 * Upgraded: better model selection, retry on rate-limit, higher token limit for richer output
 */

const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Use the most capable model; fall back via env
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Call Groq for plain text output.
 */
async function callLLM(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3500,  // Kept low to stay within free-tier 12k TPM
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Groq returned an empty response.');
      return text.trim();
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        console.warn(`[groq] Rate limited, retrying in ${(attempt + 1) * 5}s…`);
        await sleep((attempt + 1) * 5000);
        continue;
      }
      if (err.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
      throw new Error(`Groq API error: ${err.message}`);
    }
  }
}

/**
 * Call Groq with JSON mode — guarantees valid JSON output.
 * v2: higher max_tokens + smarter fallback parsing
 */
async function callLLMJSON(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.1,   // Very low = highly deterministic, best for structured JSON
        max_tokens: 6000,   // Balanced for free-tier 12k TPM limit
        response_format: { type: 'json_object' },
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) throw new Error('Groq returned an empty response.');

      console.log('[groq] JSON preview:', raw.slice(0, 300));

      try {
        return JSON.parse(raw.trim());
      } catch {
        // Try to extract JSON block
        const start = raw.indexOf('{');
        const end   = raw.lastIndexOf('}');
        if (start !== -1 && end > start) {
          return JSON.parse(raw.slice(start, end + 1));
        }
        throw new Error(`Invalid JSON from Groq: ${raw.slice(0, 300)}`);
      }
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        console.warn(`[groq] Rate limited, retrying in ${(attempt + 1) * 5}s…`);
        await sleep((attempt + 1) * 5000);
        continue;
      }
      if (err.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
      throw err;
    }
  }
}

module.exports = { callLLM, callLLMJSON };
