import { calculateEmbedding } from '../utils/aiHelper.js';
import { getVectorStore } from './vectorStore.js';
import { classifyTopic } from './topicClassifier.js';
import aiCacheService from './aiCache.service.js';
import { ragLogger } from '../utils/logger.js';

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * RetrievalService
 * ───────────────────────────────────────────────────────────────────────────────
 * Orchestrates the full retrieval pipeline:
 *
 *   1. Classify query → detect subject + confidence
 *   2. Compute query embedding
 *   3. Query vector store (with subject filter + minScore threshold)
 *   4. Return structured context object for LLM injection
 *
 * Cache strategy:
 *   - Retrieved context is cached in Redis for 6 hours (RETRIEVAL_TTL)
 *   - Cache key is based on userId + query hash
 *
 * Exports:
 *   retrieve(query, opts)             → structured context
 *   semanticSearch(query, subject, userId, topK)  → backward-compat shim
 * ───────────────────────────────────────────────────────────────────────────────
 */

// 6 hours TTL for retrieved context
const RETRIEVAL_TTL = 6 * 60 * 60;

/**
 * Retrieve the most relevant document chunks for a query.
 *
 * @param {string} query  - Raw student query
 * @param {Object} opts
 * @param {string}  [opts.userId]         - For cache keying
 * @param {string}  [opts.subjectHint]    - Optional forced subject (skip classification)
 * @param {number}  [opts.topK=5]         - Number of chunks to return
 * @param {number}  [opts.minScore=0.70]  - Minimum similarity threshold
 * @param {string}  [opts.sourceType]     - Filter by source type
 * @returns {Promise<{
 *   context: Array<{ text: string, subject: string, unit: string, topic: string, score: number }>,
 *   detectedSubject: string,
 *   confidence: number,
 *   fromCache: boolean,
 *   durationMs: number
 * }>}
 */
export const retrieve = async (query, {
    userId = 'anonymous',
    subjectHint = null,
    topK = 5,
    minScore = 0.70,
    sourceType = null,
} = {}) => {
    const start = Date.now();
    const topic = `retrieval:${query}:${subjectHint || ''}`;

    // ─── Cache check ──────────────────────────────────────────────────────────
    const cached = await aiCacheService.get({
        userId: String(userId),
        featureType: 'rag_search',
        topic,
    });

    if (cached) {
        ragLogger.log('RETRIEVE_CACHE_HIT', { query: query.slice(0, 60) });
        return { ...cached.result, fromCache: true, durationMs: Date.now() - start };
    }

    // ─── Stage 1: Topic Classification ────────────────────────────────────────
    let detectedSubject, confidence;

    if (subjectHint) {
        detectedSubject = subjectHint;
        confidence = 1.0;
    } else {
        const classification = await classifyTopic(query);
        detectedSubject = classification.subject;
        confidence = classification.confidence;
    }

    // ─── Stage 2: Embed Query ─────────────────────────────────────────────────
    const queryEmbedding = await calculateEmbedding(query);

    // ─── Stage 3: Vector Search ───────────────────────────────────────────────
    const store = getVectorStore();
    const results = await store.query(queryEmbedding, {
        subject: detectedSubject,
        sourceType,
        topK,
        minScore,
    });

    // ─── Stage 4: Format context ──────────────────────────────────────────────
    const context = results.map(r => ({
        text: r.content,
        subject: r.subject,
        unit: r.unit || '',
        topic: r.topic || '',
        score: r.score,
        source: r.fileName,
    }));

    const output = { context, detectedSubject, confidence };

    ragLogger.retrieval({
        query,
        subject: detectedSubject,
        confidence,
        chunks: context.length,
        durationMs: Date.now() - start,
    });

    // ─── Cache the result ─────────────────────────────────────────────────────
    await aiCacheService.set(
        { userId: String(userId), featureType: 'rag_search', topic },
        output,
        { modelName: 'retrieval', tokenUsage: 0 },
        RETRIEVAL_TTL
    );

    return { ...output, fromCache: false, durationMs: Date.now() - start };
};

/**
 * Backward-compatible shim for existing callers of semanticSearch().
 * Returns plain array of text strings (same as old rag.service.js API).
 *
 * @param {string} query
 * @param {string} subject
 * @param {string|ObjectId} userId
 * @param {number} [topK=5]
 * @returns {Promise<string[]>}
 */
export const semanticSearch = async (query, subject, userId, topK = 5) => {
    const { context } = await retrieve(query, {
        userId: String(userId),
        subjectHint: subject,
        topK,
    });
    return context.map(c => c.text);
};
