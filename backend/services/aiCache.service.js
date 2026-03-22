import { getRedisClient } from '../config/redis.js';
import {
    buildCacheKey,
    buildInvalidationPattern,
    serialisePayload,
    deserialisePayload,
} from '../utils/cacheHelper.js';

/**
 * AICacheService
 * ──────────────
 * The single source-of-truth for all Redis caching of AI outputs.
 *
 * Features:
 *  • get()        — Check the cache before calling the LLM
 *  • set()        — Store an AI result with TTL and metadata
 *  • invalidate() — Delete all cached AI results for a user (e.g. on syllabus update)
 *  • wrap()       — Convenience: check cache → run fn → store result
 *
 * All public methods degrade gracefully if Redis is unavailable:
 *  • get()  → returns null  (caller falls through to LLM)
 *  • set()  → no-op silently
 *  • invalidate() → logs a warning, does not throw
 *  • wrap() → executes the original function as if no cache exists
 */

// 24 hours in seconds
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

class AICacheService {
    /**
     * Returns true if the Redis client is alive and ready.
     */
    _isRedisAvailable() {
        const client = getRedisClient();
        return client && client.isAvailable;
    }

    /**
     * Retrieves a cached AI result.
     *
     * @param {Object} keyParams - { userId, featureType, topic }
     * @returns {Promise<{ result: *, metadata: Object } | null>}
     *          Returns the parsed payload on hit, null on miss or Redis unavailable.
     */
    async get(keyParams) {
        if (!this._isRedisAvailable()) return null;

        const client = getRedisClient();
        const key = buildCacheKey({
            userId: keyParams.userId,
            featureType: keyParams.featureType,
            topic: keyParams.topic
        });

        try {
            const raw = await client.get(key);
            if (!raw) return null;

            const payload = deserialisePayload(raw);
            if (payload) {
                console.log(`[AICacheService] 🎯 Cache HIT  → ${key}`);
            }
            return payload;
        } catch (err) {
            console.warn(`[AICacheService] ⚠️  GET failed for "${key}" — ${err.message}`);
            return null;
        }
    }

    /**
     * Stores an AI result in Redis.
     *
     * @param {Object} keyParams        - { userId, featureType, topic }
     * @param {*}      result           - The AI-generated output to cache
     * @param {Object} [meta={}]        - Optional metadata
     * @param {number} [meta.tokenUsage=0]
     * @param {string} [meta.modelName='gemini']
     * @param {number} [ttl]            - TTL in seconds (defaults to 24 h)
     * @returns {Promise<void>}
     */
    async set(keyParams, result, meta = {}, ttl = DEFAULT_TTL_SECONDS) {
        if (!this._isRedisAvailable()) return;

        const client = getRedisClient();
        const key = buildCacheKey({
            userId: keyParams.userId,
            featureType: keyParams.featureType,
            topic: keyParams.topic
        });
        const value = serialisePayload({
            result,
            tokenUsage: meta.tokenUsage ?? 0,
            modelName: meta.modelName ?? 'gemini',
        });

        try {
            await client.set(key, value, 'EX', ttl);
            console.log(`[AICacheService] 💾 Cache SET  → ${key}  (TTL: ${ttl}s)`);
        } catch (err) {
            console.warn(`[AICacheService] ⚠️  SET failed for "${key}" — ${err.message}`);
        }
    }

    /**
     * Invalidates ALL cached AI outputs for a specific user.
     * Should be called whenever the user's syllabus is updated.
     *
     * Uses SCAN (not KEYS) to avoid blocking the Redis server.
     *
     * @param {string} userId - MongoDB ObjectId string of the user
     * @returns {Promise<number>} Number of keys deleted
     */
    async invalidate(userId) {
        if (!this._isRedisAvailable()) {
            console.warn('[AICacheService] ⚠️  invalidate() skipped — Redis unavailable.');
            return 0;
        }

        const client = getRedisClient();
        const pattern = buildInvalidationPattern(userId);
        let cursor = '0';
        const keysToDelete = [];

        try {
            // Use SCAN to iterate safely
            do {
                const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                keysToDelete.push(...keys);
            } while (cursor !== '0');

            if (keysToDelete.length > 0) {
                await client.del(...keysToDelete);
                console.log(`[AICacheService] 🗑️  Invalidated ${keysToDelete.length} key(s) for user ${userId}.`);
            } else {
                console.log(`[AICacheService] ℹ️  No cached keys found for user ${userId}.`);
            }

            return keysToDelete.length;
        } catch (err) {
            console.warn(`[AICacheService] ⚠️  invalidate() error for pattern "${pattern}" — ${err.message}`);
            return 0;
        }
    }

    /**
     * Cache wrapper — the recommended way to use the cache.
     *
     * 1. Checks cache with `keyParams`.
     * 2. On HIT  → returns cached payload immediately.
     * 3. On MISS → calls `fn()`, stores the result, returns it.
     *
     * @param {Object}   keyParams          - { userId, featureType, topic }
     * @param {Function} fn                 - Async function that calls the LLM.
     *                                        Must return { result, tokenUsage?, modelName? }
     * @param {number}   [ttl]              - Optional custom TTL in seconds
     * @returns {Promise<{ result: *, metadata: Object, fromCache: boolean }>}
     *
     * @example
     * const { result, metadata, fromCache } = await aiCacheService.wrap(
     *   { userId, featureType: 'notes', topic: 'OS - Unit 1' },
     *   async () => {
     *     const text = await callGeminiRest(prompt, [], systemPrompt);
     *     return { result: text, modelName: 'gemini-2.0-flash', tokenUsage: 0 };
     *   }
     * );
     */
    async wrap(keyParams, fn, ttl = DEFAULT_TTL_SECONDS) {
        // 1. Try cache first
        const cached = await this.get(keyParams);
        if (cached) {
            return { ...cached, fromCache: true };
        }

        // 2. Call the LLM function
        const { result, tokenUsage = 0, modelName = 'gemini' } = await fn();

        // 3. Store result in cache (non-blocking; errors logged internally)
        await this.set(keyParams, result, { tokenUsage, modelName }, ttl);

        return {
            result,
            metadata: {
                createdAt: new Date().toISOString(),
                tokenUsage,
                modelName,
                cachedBy: 'IntelliCampus-AICacheService',
            },
            fromCache: false,
        };
    }
}

// Export a singleton instance
const aiCacheService = new AICacheService();
export default aiCacheService;
