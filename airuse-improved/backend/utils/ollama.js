const fetch = require('node-fetch');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL    || 'phi3';
const TEMPERATURE     = parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.2;
const MAX_TOKENS      = parseInt(process.env.OLLAMA_MAX_TOKENS)    || 2048;

async function callOllama(systemPrompt, userPrompt) {
  const url = `${OLLAMA_BASE_URL}/api/chat`;

  const body = {
    model: OLLAMA_MODEL,
    stream: false,
    options: {
      temperature: TEMPERATURE,
      num_predict: MAX_TOKENS,
      num_ctx: 4096,
    },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  };

  let response;
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      timeout: 300000,
    });
  } catch (err) {
    throw new Error(`Cannot reach Ollama at ${OLLAMA_BASE_URL}. Run "ollama serve" first. (${err.message})`);
  }

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new Error(`Ollama returned HTTP ${response.status}: ${txt}`);
  }

  const data = await response.json();
  const text = data?.message?.content;
  if (!text) throw new Error('Ollama returned empty response.');
  return text.trim();
}

async function callOllamaJSON(systemPrompt, userPrompt) {
  const raw = await callOllama(systemPrompt, userPrompt);

  console.log('[ollama] Raw response preview:', raw.slice(0, 200));

  // Strip any number of backticks + optional "json" label from start and end
  let cleaned = raw
    .replace(/^`{1,3}(?:json)?\s*/i, '')  // strip ```json or ``json or `json at start
    .replace(/\s*`{1,3}\s*$/i, '')         // strip ``` or `` or ` at end
    .trim();

  // Find the first { and last } and extract just that block
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Try to fix truncated JSON
  try {
    const fixed = fixTruncated(cleaned);
    console.log('[ollama] Attempting truncation fix...');
    return JSON.parse(fixed);
  } catch (__) {}

  throw new Error(`Model did not return valid JSON. Raw response:\n\n${raw.slice(0, 500)}`);
}

function fixTruncated(str) {
  const start = str.indexOf('{');
  if (start === -1) throw new Error('No JSON found');
  let s = str.slice(start);

  // Count open/close braces and brackets
  let braces = 0, brackets = 0, inString = false, escape = false;
  for (const ch of s) {
    if (escape)          { escape = false; continue; }
    if (ch === '\\')     { escape = true;  continue; }
    if (ch === '"')      { inString = !inString; continue; }
    if (inString)        continue;
    if (ch === '{')      braces++;
    if (ch === '}')      braces--;
    if (ch === '[')      brackets++;
    if (ch === ']')      brackets--;
  }

  // If we're in a string, close it
  if (inString) s += '"';
  // Close open arrays and objects
  for (let i = 0; i < brackets; i++) s += ']';
  for (let i = 0; i < braces;   i++) s += '}';

  return s;
}

module.exports = { callOllama, callOllamaJSON };
