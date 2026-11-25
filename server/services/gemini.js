const { GoogleGenAI } = require('@google/genai');

const TIMEOUT_MS = 20000;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
}

function getModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

async function withTimeout(promise, ms) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

async function callWithRetry(fn) {
  try {
    return await withTimeout(fn(), TIMEOUT_MS);
  } catch (firstErr) {
    // Retry once on failure
    return await withTimeout(fn(), TIMEOUT_MS);
  }
}

/**
 * Call Gemini with JSON output mode (temperature 0.4 by default).
 */
async function generateJson({ systemInstruction, userPrompt, temperature = 0.4 }) {
  const ai = getClient();
  const model = getModelName();

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature,
        responseMimeType: 'application/json',
      },
    });
    return response.text;
  });
}

/**
 * Call Gemini for plain text output (temperature 0.8 by default).
 */
async function generateText({ systemInstruction, userPrompt, temperature = 0.8 }) {
  const ai = getClient();
  const model = getModelName();

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature,
      },
    });
    return response.text;
  });
}

module.exports = {
  generateJson,
  generateText,
};
