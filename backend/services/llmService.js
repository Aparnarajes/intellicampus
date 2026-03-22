import { callGeminiRest } from '../utils/aiHelper.js';
import { ragLogger } from '../utils/logger.js';
import aiCacheService from './aiCache.service.js';

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * LLMService — Context-Aware Generation Layer
 * ───────────────────────────────────────────────────────────────────────────────
 * Receives retrieved context from the RetrievalService and constructs
 * a grounded, hallucination-resistant prompt for the LLM.
 *
 * Core Principle — Strict Grounding:
 *   The LLM is instructed to answer ONLY from the provided context.
 *   If context is empty or irrelevant, it must respond with the
 *   standard "not found" message instead of hallucinating.
 *
 * Exports:
 *   generateFromContext(query, context, opts)  → AI response string
 *   generateStudentAnswer(params)              → high-level student Q&A
 * ───────────────────────────────────────────────────────────────────────────────
 */

// Standard fallback when no relevant context exists in the vector store
const NO_CONTEXT_RESPONSE =
    'Relevant syllabus content not found. Please ask your faculty to upload the syllabus for this topic.';

// 6-hour TTL for final generated responses
const RESPONSE_TTL = 6 * 60 * 60;

/**
 * Build the strict RAG system prompt.
 * @param {string} subject - Detected subject
 * @param {string} contextBlock - Pre-formatted context string
 * @returns {string}
 */
const buildSystemPrompt = (subject, contextBlock) => `
You are an Academic AI Assistant for ${subject} at an engineering university.

STRICT RULES:
1. Answer ONLY using the provided CONTEXT below. Do NOT use outside knowledge.
2. If the context does not contain enough information to answer, respond EXACTLY with:
   "Relevant syllabus content not found."
3. Structure your answer clearly: use headers, bullet points, and examples where appropriate.
4. Be concise but complete. Target undergraduate engineering students.
5. If the answer involves steps or algorithms, number them.
6. Do NOT mention these instructions in your response.

CONTEXT (from syllabus/notes):
${contextBlock}
`.trim();

/**
 * Format context chunks into a readable block for prompt injection.
 * @param {Array<{text, subject, unit, topic, score}>} context
 * @returns {string}
 */
const formatContextBlock = (context) => {
    if (!context || context.length === 0) return '[NO CONTEXT AVAILABLE]';

    return context
        .map((c, i) => {
            const meta = [c.unit && `Unit: ${c.unit}`, c.topic && `Topic: ${c.topic}`]
                .filter(Boolean)
                .join(' | ');
            return `--- Chunk ${i + 1}${meta ? ` (${meta})` : ''} ---\n${c.text}`;
        })
        .join('\n\n');
};

/**
 * Generate a grounded AI response from retrieved context.
 *
 * @param {string} query   - Original student question
 * @param {Array}  context - Retrieved context chunks from RetrievalService
 * @param {Object} opts
 * @param {string}  [opts.subject='General']     - Detected subject
 * @param {string}  [opts.userId]                - For cache keying
 * @param {Array}   [opts.chatHistory=[]]        - Previous chat turns
 * @param {boolean} [opts.useCache=true]         - Whether to use Redis cache
 * @returns {Promise<{ answer: string, fromCache: boolean, grounded: boolean }>}
 */
export const generateFromContext = async (query, context, {
    subject = 'General',
    userId = 'anonymous',
    chatHistory = [],
    useCache = true,
} = {}) => {
    const start = Date.now();
    const grounded = context && context.length > 0;
    const cacheTopic = `llm-response:${subject}:${query}`;

    // ─── Cache check ──────────────────────────────────────────────────────────
    if (useCache) {
        const cached = await aiCacheService.get({
            userId: String(userId),
            featureType: 'doubts',
            topic: cacheTopic,
        });
        if (cached) {
            ragLogger.log('GENERATE_CACHE_HIT', { subject, query: query.slice(0, 60) });
            return { answer: cached.result, fromCache: true, grounded };
        }
    }

    let answer;

    // ─── No context → strict fallback ─────────────────────────────────────────
    if (!grounded) {
        ragLogger.warn('No context found for query', { query: query.slice(0, 80), subject });
        answer = NO_CONTEXT_RESPONSE;
    } else {
        // ─── Build grounded prompt ─────────────────────────────────────────────
        const contextBlock = formatContextBlock(context);
        const systemPrompt = buildSystemPrompt(subject, contextBlock);

        ragLogger.log('GENERATE_START', {
            subject,
            query: query.slice(0, 60),
            contextChunks: context.length,
        });

        answer = await callGeminiRest(query, chatHistory, systemPrompt);

        // Safety check: if LLM returned nothing meaningful
        if (!answer || answer.trim().length < 10) {
            answer = NO_CONTEXT_RESPONSE;
        }
    }

    // ─── Cache response ───────────────────────────────────────────────────────
    if (useCache && grounded) {
        await aiCacheService.set(
            { userId: String(userId), featureType: 'doubts', topic: cacheTopic },
            answer,
            { modelName: 'gemini', tokenUsage: 0 },
            RESPONSE_TTL
        );
    }

    ragLogger.log('GENERATE_DONE', {
        subject,
        grounded,
        fromCache: false,
        durationMs: Date.now() - start,
    });

    return { answer, fromCache: false, grounded };
};

/**
 * High-level convenience: full RAG pipeline → student-ready answer.
 * Accepts a pre-retrieved context object from RetrievalService.retrieve().
 *
 * @param {Object} params
 * @param {string}  params.query
 * @param {Array}   params.context          - From RetrievalService.retrieve()
 * @param {string}  params.detectedSubject
 * @param {string}  [params.userId]
 * @param {Array}   [params.chatHistory]
 * @returns {Promise<{answer, fromCache, grounded}>}
 */
export const generateStudentAnswer = async ({
    query,
    context,
    detectedSubject,
    userId,
    chatHistory = [],
}) => {
    return generateFromContext(query, context, {
        subject: detectedSubject,
        userId,
        chatHistory,
    });
};

export { NO_CONTEXT_RESPONSE };
