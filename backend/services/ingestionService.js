import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { calculateEmbedding } from '../utils/aiHelper.js';
import { getVectorStore } from './vectorStore.js';
import { ragLogger } from '../utils/logger.js';
import DocumentChunk from '../models/DocumentChunk.js';

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * IngestionService
 * ───────────────────────────────────────────────────────────────────────────────
 * Handles the full PDF/DOCX/TXT → chunk → embed → store pipeline.
 *
 * Pipeline:
 *   1. Extract raw text (PDF / DOCX / plain text)
 *   2. Clean & normalize text
 *   3. Chunk into 400–500 token segments with 100-token overlap
 *   4. Identify unit/topic from chunk position and content
 *   5. Generate Gemini embeddings for each chunk
 *   6. Upsert into the VectorStore (MongoDB or Pinecone)
 * ───────────────────────────────────────────────────────────────────────────────
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 1800;  // ~400-500 tokens (4 chars/token average)
const CHUNK_OVERLAP = 360; // ~90 tokens overlap for context continuity
const MAX_CONCURRENCY = 5; // Max parallel embedding requests

// ─── Text Extraction ──────────────────────────────────────────────────────────
/**
 * Extract plain text from a file buffer based on its extension.
 * @param {Buffer} buffer
 * @param {string} extension - File extension without dot (pdf, docx, txt)
 * @returns {Promise<string>}
 */
const extractText = async (buffer, extension) => {
    switch (extension.toLowerCase()) {
        case 'pdf': {
            const data = await pdfParse(buffer);
            return data.text;
        }
        case 'docx': {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        case 'txt':
        case 'md':
        default:
            return buffer.toString('utf-8');
    }
};

// ─── Text Cleaning ────────────────────────────────────────────────────────────
/**
 * Normalize extracted text:
 * - Remove multiple blank lines
 * - Remove control characters
 * - Normalize unicode whitespace
 * @param {string} text
 * @returns {string}
 */
const cleanText = (text) => {
    return text
        .replace(/\r\n/g, '\n')                // Normalize line endings
        .replace(/\u00A0/g, ' ')               // Non-breaking space → space
        .replace(/[^\x09\x0A\x0D\x20-\x7E\u00C0-\u024F]/g, ' ') // Remove non-printable chars (keep accents)
        .replace(/\n{3,}/g, '\n\n')            // Collapse 3+ blank lines to 2
        .replace(/ {2,}/g, ' ')                // Collapse multiple spaces
        .trim();
};

// ─── Chunking ─────────────────────────────────────────────────────────────────
/**
 * Split text into overlapping chunks.
 * Returns array of {text, chunkIndex} objects.
 *
 * @param {string} text
 * @param {number} [size=CHUNK_SIZE]
 * @param {number} [overlap=CHUNK_OVERLAP]
 * @returns {Array<{text: string, chunkIndex: number}>}
 */
const chunkText = (text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
    const chunks = [];
    let start = 0;
    let idx = 0;

    while (start < text.length) {
        // Try to end chunk at a sentence boundary for better coherence
        let end = Math.min(start + size, text.length);
        if (end < text.length) {
            const periodIdx = text.lastIndexOf('.', end);
            const newlineIdx = text.lastIndexOf('\n', end);
            const boundary = Math.max(periodIdx, newlineIdx);
            if (boundary > start + size * 0.7) {
                end = boundary + 1; // include the period/newline
            }
        }

        const chunkText = text.slice(start, end).trim();
        if (chunkText.length > 50) { // Skip tiny chunks
            chunks.push({ text: chunkText, chunkIndex: idx++ });
        }

        start += (size - overlap);
    }

    return chunks;
};

// ─── Unit/Topic Detection ─────────────────────────────────────────────────────
/**
 * Try to extract unit number from chunk text using common heading patterns.
 * Returns detected unit string or null.
 *
 * @param {string} text
 * @returns {string|null}
 */
const detectUnit = (text) => {
    const patterns = [
        /unit\s*[-:]?\s*(\d+)/i,
        /module\s*[-:]?\s*(\d+)/i,
        /chapter\s*[-:]?\s*(\d+)/i,
        /section\s*[-:]?\s*(\d+)/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return `Unit ${match[1]}`;
    }
    return null;
};

// ─── Batched Concurrency Control ──────────────────────────────────────────────
/**
 * Run async tasks with a concurrency limit.
 * @param {Array<Function>} tasks - Array of async thunk functions
 * @param {number} limit - Max concurrency
 * @returns {Promise<Array>} Results (preserving order, nulls on individual errors)
 */
const runWithConcurrency = async (tasks, limit) => {
    const results = new Array(tasks.length).fill(null);
    let cursor = 0;

    const worker = async () => {
        while (cursor < tasks.length) {
            const idx = cursor++;
            try {
                results[idx] = await tasks[idx]();
            } catch (err) {
                ragLogger.warn(`Chunk ${idx} failed: ${err.message}`);
                results[idx] = null;
            }
        }
    };

    await Promise.all(Array.from({ length: limit }, worker));
    return results;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Full ingestion pipeline: extract → clean → chunk → embed → store.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer        - File binary buffer
 * @param {string} params.originalName  - Original filename (used for ext detection + metadata)
 * @param {string} params.subject       - Academic subject label
 * @param {string} [params.topic]       - Optional topic override
 * @param {string} [params.unit]        - Optional unit override
 * @param {string} params.sourceType    - 'syllabus' | 'notes' | 'questionPaper'
 * @param {boolean} [params.replace=false] - If true, delete existing chunks for this file first
 * @returns {Promise<{ total: number, indexed: number, skipped: number, durationMs: number }>}
 */
export const ingestDocument = async ({
    buffer,
    originalName,
    subject,
    topic,
    unit: unitOverride,
    sourceType,
    replace = false,
}) => {
    const start = Date.now();
    const extension = originalName.split('.').pop();
    const store = getVectorStore();

    ragLogger.log('INGEST_START', { file: originalName, subject, sourceType });

    // ① Extract text
    const rawText = await extractText(buffer, extension);
    if (!rawText || rawText.trim().length < 50) {
        throw new Error(`No readable text found in "${originalName}". Is the PDF text-selectable?`);
    }

    // ② Clean text
    const cleanedText = cleanText(rawText);
    ragLogger.log('INGEST_EXTRACT', { chars: cleanedText.length, file: originalName });

    // ③ Delete previous chunks for this file (replace mode)
    if (replace) {
        const deleted = await store.deleteBySource(originalName, subject);
        ragLogger.log('INGEST_REPLACE', { deleted, file: originalName });
    }

    // ④ Chunk
    const rawChunks = chunkText(cleanedText);
    ragLogger.log('INGEST_CHUNK', { chunks: rawChunks.length, file: originalName });

    // Track the last detected unit across chunks (units persist until new one found)
    let currentUnit = unitOverride || null;

    // ⑤ Build embedding tasks
    const tasks = rawChunks.map(({ text, chunkIndex }) => async () => {
        // Detect unit from chunk content
        const detectedUnit = detectUnit(text);
        if (detectedUnit) currentUnit = detectedUnit;

        const embedding = await calculateEmbedding(text);

        return {
            content: text,
            embedding,
            subject,
            topic: topic || null,
            unit: currentUnit || null,
            sourceType,
            fileName: originalName,
            metadata: {
                chunkIndex,
                charCount: text.length,
                unit: currentUnit,
            },
        };
    });

    // ⑥ Run with concurrency cap to avoid rate-limiting embedding API
    const chunkResults = await runWithConcurrency(tasks, MAX_CONCURRENCY);
    const valid = chunkResults.filter(Boolean);

    // ⑦ Store
    if (valid.length > 0) {
        await store.upsert(valid);
    }

    const durationMs = Date.now() - start;
    ragLogger.ingest({ file: originalName, subject, chunks: valid.length, durationMs });

    return {
        total: rawChunks.length,
        indexed: valid.length,
        skipped: rawChunks.length - valid.length,
        durationMs,
    };
};

/**
 * List all ingested documents with metadata.
 * @returns {Promise<Array>}
 */
export const listDocuments = async () => {
    const store = getVectorStore();
    return store.getDocumentList();
};

/**
 * Delete all chunks for a specific document.
 * @param {string} fileName
 * @param {string} [subject]
 * @returns {Promise<number>} Deleted chunk count
 */
export const deleteDocument = async (fileName, subject) => {
    const store = getVectorStore();
    const count = await store.deleteBySource(fileName, subject);
    ragLogger.log('INGEST_DELETE', { file: fileName, subject, deleted: count });
    return count;
};
