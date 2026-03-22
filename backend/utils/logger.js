import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { combine, timestamp, colorize, printf, errors, json } = winston.format;

// ─── Console Format (human-readable) ─────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const msg = stack || message;
    return `${timestamp} [${level}] ${msg}${metaStr}`;
});

// ─── Logger Instance ──────────────────────────────────────────────────────────
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    transports: [
        // Console transport with colour
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                consoleFormat
            ),
        }),
    ],
    exitOnError: false,
});

// ─── RAG-specific structured logger ──────────────────────────────────────────
export const ragLogger = {
    /**
     * Log a RAG query lifecycle event.
     * @param {string} event - e.g. 'QUERY', 'CLASSIFY', 'RETRIEVE', 'GENERATE'
     * @param {Object} data  - Arbitrary context fields
     */
    log(event, data = {}) {
        logger.info(`[RAG:${event}]`, { ...data, ts: Date.now() });
    },

    /**
     * Log a retrieval result with scores and timings.
     */
    retrieval({ query, subject, confidence, chunks, durationMs }) {
        logger.info('[RAG:RETRIEVE]', {
            query: query.slice(0, 80),
            detectedSubject: subject,
            classifierConfidence: confidence,
            chunksReturned: chunks,
            durationMs,
        });
    },

    /**
     * Log an ingestion event.
     */
    ingest({ file, subject, chunks, durationMs }) {
        logger.info('[RAG:INGEST]', { file, subject, chunks, durationMs });
    },

    warn(msg, meta = {}) {
        logger.warn(`[RAG] ${msg}`, meta);
    },

    error(msg, err = {}) {
        logger.error(`[RAG] ${msg}`, { error: err.message, stack: err.stack });
    },
};

export default logger;
