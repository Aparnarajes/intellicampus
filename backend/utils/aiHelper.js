import dotenv from 'dotenv';
dotenv.config();

// Full list of usable models, sorted best-first.
// Populated on first call and reused. Cleared when all are quota-exhausted.
let cachedModelList = null;

/**
 * Scores a model name for ordering — higher = preferred.
 */
const scoreModel = (name) => {
    if (name.includes('2.0') && name.includes('flash') && !name.includes('lite')) return 100;
    if (name.includes('1.5') && name.includes('flash') && !name.includes('8b') && !name.includes('lite')) return 90;
    if (name.includes('flash') && name.includes('8b')) return 70;
    if (name.includes('flash')) return 80;
    if (name.includes('pro')) return 50;
    return 10;
};

/**
 * Fetches all generateContent-capable models for this API key,
 * sorts them best-first, and caches the result.
 */
const getModelList = async (apiKey) => {
    if (cachedModelList && cachedModelList.length > 0) return cachedModelList;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        if (data.models) {
            const candidates = data.models
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => m.name.split('/').pop())
                // Skip experimental/preview — they have stricter quotas
                .filter(n => !n.includes('exp') && !n.includes('preview'));

            candidates.sort((a, b) => scoreModel(b) - scoreModel(a));

            console.log('[aiHelper] 📋 Available models:', candidates.join(', '));
            cachedModelList = candidates;
            return cachedModelList;
        }
    } catch (e) {
        console.error('[aiHelper] Model discovery error:', e.message);
    }

    // Hard safe fallback
    cachedModelList = ['gemini-2.0-flash-lite'];
    return cachedModelList;
};

/** Kept for any callers that import this directly */
export const discoverBestModel = async (apiKey) => {
    const list = await getModelList(apiKey);
    return list[0];
};

/** Sleep helper */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hits one specific Gemini model endpoint.
 * Tags the error with .isQuotaError or .isModelError so the caller
 * knows whether to retry or move on.
 */
const callModel = async (apiKey, modelName, contents) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
    });
    const data = await response.json();

    if (!response.ok) {
        const msg = data.error?.message || `AI API Error ${response.status}`;
        const err = new Error(msg);
        err.status = response.status;
        err.isQuotaError = response.status === 429 || msg.toLowerCase().includes('quota');
        err.isModelError = response.status === 404
            || msg.toLowerCase().includes('not found')
            || msg.toLowerCase().includes('not supported');
        throw err;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

/**
 * Calls Gemini with automatic retry-on-quota and model fallback.
 *
 * Per model:
 *   quota error  → wait 5 s → retry once → move to next model
 *   model error  → skip immediately to next model
 *   other error  → rethrow (auth failure, bad request, etc.)
 */
export const callGeminiRest = async (message, history = [], systemPrompt = '') => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env');

    const modelQueue = await getModelList(apiKey);

    // Build contents array
    let contents = [];
    if (history && history.length > 0) {
        contents = history
            .filter(item => item.content && item.content.trim() !== '')
            .map(item => ({
                role: item.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: item.content }]
            }));
    }

    const finalMessage = systemPrompt
        ? `CONTEXT/SYSTEM PROMPT: ${systemPrompt}\n\nUSER MESSAGE: ${message}`
        : message;

    contents.push({ role: 'user', parts: [{ text: finalMessage }] });

    // Gemini requires the first turn to be a user turn
    if (contents.length > 1 && contents[0].role === 'model') {
        contents.shift();
    }

    for (const model of modelQueue) {
        const MAX_RETRIES = 2;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const text = await callModel(apiKey, model, contents);
                if (!text) {
                    // Empty response — treat as transient, try next model
                    console.warn(`[aiHelper] ⚠️  Empty response from ${model}, skipping.`);
                    break;
                }
                if (model !== modelQueue[0]) {
                    console.warn(`[aiHelper] ⚡ Succeeded with fallback model: ${model}`);
                }
                return text;
            } catch (err) {
                if (err.isModelError) {
                    console.warn(`[aiHelper] ⚠️  Model unavailable, skipping: ${model}`);
                    break; // skip to next model
                } else if (err.isQuotaError) {
                    if (attempt < MAX_RETRIES) {
                        const waitMs = attempt * 3000;
                        console.warn(`[aiHelper] ⏳ Quota on ${model} (attempt ${attempt}/${MAX_RETRIES}). Waiting ${waitMs / 1000}s…`);
                        await sleep(waitMs);
                    } else {
                        console.warn(`[aiHelper] ❌ ${model} quota exhausted. Trying next model…`);
                    }
                } else {
                    // Bad request, invalid API key, etc. — don't retry
                    console.error(`[aiHelper] 💥 Fatal error on ${model}:`, err.message);
                    throw err;
                }
            }
        }
    }

    // All models tried and failed — reset cache so next request re-discovers
    cachedModelList = null;

    throw new Error(
        'All available AI models are currently rate-limited. ' +
        'Please wait 1–2 minutes and try again, or upgrade your Gemini API plan.'
    );
};

/** Generates a text embedding vector */
export const calculateEmbedding = async (text) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || 'Embedding API Error');
    }

    return data.embedding.values;
};
