import Redis from 'ioredis';

/**
 * Redis Client Configuration for IntelliCampus
 * ─────────────────────────────────────────────
 * · Connects to Redis using env vars (REDIS_URL or host/port).
 * · On connection errors, sets `redisClient.isAvailable = false`
 *   so the rest of the app can degrade gracefully.
 * · All cache operations should check `redisClient.isAvailable`
 *   before interacting with Redis.
 */

let redisClient = null;

const createRedisClient = () => {
    const redisUrl = process.env.REDIS_URL;

    const options = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),

        // Retry strategy — give up after 3 failed attempts so the 
        // server doesn't hang waiting for a Redis connection on startup.
        retryStrategy(times) {
            if (times > 3) {
                console.warn('[Redis] ⚠️  Max retries reached. Running WITHOUT cache.');
                return undefined; // stop retrying by returning undefined in ioredis
            }
            return Math.min(times * 500, 2000); // back-off ms
        },

        maxRetriesPerRequest: null, // Allow it to fail instead of throwing
        enableOfflineQueue: false, // fail fast instead of queuing commands
        lazyConnect: true,         // don't auto-connect; we call .connect() manually
        connectTimeout: 2000,
    };

    const client = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

    // Track availability as a plain property for easy checks
    client.isAvailable = false;

    client.on('connect', () => {
        client.isAvailable = true;
        console.log('[Redis] ✅ Connected successfully.');
    });

    client.on('ready', () => {
        client.isAvailable = true;
    });

    client.on('error', (err) => {
        client.isAvailable = false;
        // Only log once per error type to avoid spam
        if (!client._lastErrorMsg || client._lastErrorMsg !== err.message) {
            console.warn(`[Redis] ⚠️  Error — ${err.message}. Caching disabled for now.`);
            client._lastErrorMsg = err.message;
        }
    });

    client.on('close', () => {
        client.isAvailable = false;
    });

    client.on('reconnecting', () => {
        console.log('[Redis] 🔄 Attempting to reconnect...');
    });

    return client;
};

/**
 * Initialises (or returns an existing) Redis client.
 * Call this once during server startup.
 */
export const connectRedis = async () => {
    if (redisClient) return redisClient;

    redisClient = createRedisClient();

    try {
        await redisClient.connect();
    } catch (err) {
        console.warn(`[Redis] ⚠️  Could not connect on startup — ${err.message}. Continuing without cache.`);
        redisClient.isAvailable = false;
    }

    return redisClient;
};

/**
 * Returns the singleton Redis client.
 * Always check `.isAvailable` before using.
 */
export const getRedisClient = () => redisClient;

export default getRedisClient;
