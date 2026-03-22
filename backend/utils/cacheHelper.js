import crypto from 'crypto';

/**
 * Cache Helper Utilities
 * ──────────────────────
 * Provides deterministic cache key construction and topic hashing
 * for IntelliCampus AI output caching.
 *
 * Cache key format:
 *   intellicampus:{userId}:{role}:{featureType}:{topicHash}
 *
 * Example:
 *   intellicampus:6612ab3c:student:notes:a4f3c1d2
 */

const CACHE_PREFIX = 'ai';

/**
 * Generates a short SHA-256 hash of a topic string.
 * Used to create a compact, URL-safe key component.
 *
 * @param {string} topic - The topic/unit/prompt identifier
 * @returns {string} First 12 hex characters of the SHA-256 hash
 */
export const hashTopic = (topic) => {
    if (!topic || typeof topic !== 'string') {
        throw new Error('[cacheHelper] hashTopic requires a non-empty string.');
    }
    return crypto
        .createHash('sha256')
        .update(topic.toLowerCase().trim())
        .digest('hex')
        .slice(0, 12);
};

/**
 * Builds the canonical Redis cache key.
 *
 * @param {Object} params
 * @param {string} params.userId      - MongoDB ObjectId string of the user
 * @param {string} params.featureType - Feature: 'notes' | 'doubts' | 'study_plan' | 'rag_search' | 'questions' | 'mocktest'
 * @param {string} params.topic       - Raw topic string (will be hashed internally)
 * @returns {string} The full Redis key
 */
export const buildCacheKey = ({ userId, featureType, topic }) => {
    if (!userId || !featureType || !topic) {
        throw new Error('[cacheHelper] buildCacheKey: userId, featureType, and topic are all required.');
    }

    const validFeatures = ['notes', 'questions', 'mocktest', 'doubts', 'study_plan', 'rag_search', 'retrieval'];
    if (!validFeatures.includes(featureType)) {
        throw new Error(`[cacheHelper] Invalid featureType "${featureType}". Must be one of: ${validFeatures.join(', ')}.`);
    }

    const topicHash = hashTopic(topic);
    return `${CACHE_PREFIX}:${String(userId)}:${featureType}:${topicHash}`;
};

/**
 * Builds a cache invalidation pattern for a user's syllabus-related keys.
 * Used with Redis SCAN + DEL when a syllabus is updated.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {string} Redis glob pattern for matching keys to invalidate
 */
export const buildInvalidationPattern = (userId) => {
    if (!userId) throw new Error('[cacheHelper] buildInvalidationPattern: userId is required.');
    return `${CACHE_PREFIX}:${String(userId)}:*`;
};

/**
 * Serialises the AI output into a cache payload.
 * Stores both the result and metadata together.
 *
 * @param {Object} params
 * @param {*}      params.result     - The AI-generated output (any JSON-serialisable value)
 * @param {number} [params.tokenUsage=0]  - Token count returned by the LLM (if available)
 * @param {string} [params.modelName='gemini'] - The model that produced the result
 * @returns {string} JSON string ready to write to Redis
 */
export const serialisePayload = ({ result, tokenUsage = 0, modelName = 'gemini' }) => {
    const payload = {
        result,
        metadata: {
            createdAt: new Date().toISOString(),
            tokenUsage,
            modelName,
            cachedBy: 'IntelliCampus-AICacheService',
        },
    };
    return JSON.stringify(payload);
};

/**
 * Deserialises a raw Redis string back into { result, metadata }.
 *
 * @param {string} raw - Raw string from Redis GET
 * @returns {{ result: *, metadata: Object } | null}
 */
export const deserialisePayload = (raw) => {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};
