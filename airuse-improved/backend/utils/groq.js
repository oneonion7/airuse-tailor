/**
 * utils/groq.js — v3
 * Improved for Vercel deployment:
 * - API key rotation: set GROQ_API_KEY_2, GROQ_API_KEY_3 in env to spread load
 * - Fast model (llama-3.1-8b-instant) for cover letters to cut latency
 * - Smart retry with key rotation on 429
 */

const Groq = require('groq-sdk');

// ── Key Pool ──────────────────────────────────────────────────────────────────
// Add GROQ_API_KEY_2, GROQ_API_KEY_3, etc. in Vercel env vars to rotate keys
// .trim() strips any \r\n added by PowerShell's echo pipe when setting env vars
const KEY_POOL = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean).map(k => k.trim());

if (KEY_POOL.length === 0) {
  console.error('[groq] ✗ No API keys found! Set GROQ_API_KEY in your environment.');
}

let keyIndex = 0;
function getNextClient() {
  const key = KEY_POOL[keyIndex % KEY_POOL.length];
  keyIndex++;
  return new Groq({ apiKey: key });
}

// ── Model Selection ───────────────────────────────────────────────────────────
// Resume JSON: use the powerful 70b model for quality
// Cover letter: use 8b-instant for speed (2–3x faster, still great quality)
// .trim() removes any \r\n injected by PowerShell echo when setting Vercel env vars
const MODEL_HEAVY = (process.env.GROQ_MODEL      || 'llama-3.3-70b-versatile').trim();
const MODEL_FAST  = (process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant').trim();

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Call Groq for plain text output.
 * Uses MODEL_FAST by default (for cover letters etc.) — much faster on Vercel.
 */
async function callLLM(systemPrompt, userPrompt, retries = 2, model = MODEL_FAST) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = getNextClient();
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,  // Cover letter doesn't need more than this
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error('Groq returned an empty response.');
      return text.trim();
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        const wait = (attempt + 1) * 3000;
        console.warn(`[groq] Rate limited (key ${keyIndex % KEY_POOL.length}), retrying in ${wait / 1000}s…`);
        await sleep(wait);
        continue;
      }
      if (err.status === 429) throw new Error('Rate limit reached. Please wait 30 seconds and try again.');
      throw new Error(`Groq API error: ${err.message}`);
    }
  }
}

/**
 * Call Groq with JSON mode — guarantees valid JSON output.
 * Uses MODEL_HEAVY (70b) for best resume quality.
 */
async function callLLMJSON(systemPrompt, userPrompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const client = getNextClient();
    try {
      const res = await client.chat.completions.create({
        model: MODEL_HEAVY,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const raw = res.choices[0]?.message?.content;
      if (!raw) throw new Error('Groq returned an empty response.');

      console.log('[groq] JSON preview:', raw.slice(0, 200));

      try {
        return JSON.parse(raw.trim());
      } catch {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end > start) {
          return JSON.parse(raw.slice(start, end + 1));
        }
        throw new Error(`Invalid JSON from Groq: ${raw.slice(0, 200)}`);
      }
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        const wait = (attempt + 1) * 3000;
        console.warn(`[groq] Rate limited (key ${keyIndex % KEY_POOL.length}), retrying in ${wait / 1000}s…`);
        await sleep(wait);
        continue;
      }
      if (err.status === 429) throw new Error('Rate limit reached. Please wait 30 seconds and try again.');
      throw err;
    }
  }
}

module.exports = { callLLM, callLLMJSON };
