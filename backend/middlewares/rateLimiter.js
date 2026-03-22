import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Rate Limiters — Production-Grade Brute Force Protection
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  authRateLimiter       → 10 attempts per 15 min on /api/auth/*
 *  aiRateLimiter         → 20 AI calls per user per day (Redis-backed)
 *  globalRateLimiter     → 200 req per 15 min (general spray protection)
 *  adminRateLimiter      → Strict 30 req per 15 min on /api/admin/*
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Auth Route Limiter (most critical) ───────────────────────────────────────
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // 15 minutes
    max: 10,                         // 10 login/register attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,    // Don't count successful logins against limit
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.',
    },
    handler: (req, res, next, options) => {
        logger.warn(`[RATE_LIMIT] Auth brute-force blocked: ${req.ip} → ${req.originalUrl}`);
        res.status(429).json(options.message);
    },
});

// ─── Admin Route Limiter ──────────────────────────────────────────────────────
export const adminRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests to admin endpoints. Please slow down.',
    },
});

// ─── AI Feature Limiter (Redis-backed, per user per day) ─────────────────────
export const aiRateLimiter = async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) return next();

    const client = getRedisClient();
    if (!client || !client.isAvailable) return next(); // Degrade gracefully

    const limit = parseInt(process.env.AI_DAILY_LIMIT || '20', 10);
    const today = new Date().toISOString().split('T')[0];
    const key = `ratelimit:ai:${userId}:${today}`;

    try {
        const current = await client.get(key);
        if (current && parseInt(current, 10) >= limit) {
            logger.warn(`[RATE_LIMIT] AI daily limit hit for user ${userId}`);
            return res.status(429).json({
                success: false,
                message: `Daily AI usage limit reached (${limit} requests/day). Try again tomorrow.`,
            });
        }

        await client.incr(key);
        await client.expire(key, 86400); // TTL: 24 hours
        next();
    } catch (err) {
        logger.error(`[aiRateLimiter] Redis error: ${err.message}`);
        next(); // Don't block on Redis failure
    }
};

// ─── Global Route Limiter ─────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
});
