import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/auth.js';
import { ingestDocument, listDocuments, deleteDocument } from '../services/ingestionService.js';
import { retrieve } from '../services/retrievalService.js';
import { generateStudentAnswer } from '../services/llmService.js';
import { classifyTopic } from '../services/topicClassifier.js';
import { ragLogger } from '../utils/logger.js';

const router = express.Router();

// Memory storage — we process the buffer directly and never write to disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt|md)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, TXT, and MD files are supported.'), false);
        }
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ingest
// @desc   Upload & ingest a document into the RAG vector store
// @access Faculty / Admin
// @body   FormData: file, subject, sourceType, topic?, unit?, replace?
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ingest',
    protect,
    authorize('faculty', 'admin'),
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) return res.error('File is required.', 400);

            const { subject, sourceType, topic, unit, replace } = req.body;
            if (!subject) return res.error('subject is required.', 400);
            if (!sourceType) return res.error('sourceType is required (syllabus | notes | questionPaper).', 400);

            const stats = await ingestDocument({
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                subject,
                topic,
                unit,
                sourceType,
                replace: replace === 'true',
            });

            return res.success(stats, `Successfully indexed ${stats.indexed} of ${stats.total} chunks (${stats.durationMs}ms).`);
        } catch (error) {
            ragLogger.error('POST /api/ingest failed', error);
            return res.error(error.message);
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/query   (also mounted as POST /api/rag/query for legacy compat)
// @desc   RAG query: classify → retrieve → generate
// @access Private (all roles)
// @body   { query, subjectHint?, topK?, sourceType? }
// ─────────────────────────────────────────────────────────────────────────────
const handleQuery = async (req, res) => {
    try {
        const { query, subjectHint, topK = 5, sourceType } = req.body;
        if (!query || query.trim().length < 3) {
            return res.error('query must be at least 3 characters.', 400);
        }

        const start = Date.now();

        // ① Retrieve context
        const {
            context,
            detectedSubject,
            confidence,
            fromCache: retrievalCached,
        } = await retrieve(query, {
            userId: req.user._id,
            subjectHint,
            topK: Math.min(Number(topK), 10),
            sourceType,
        });

        // ② Generate grounded response
        const { answer, fromCache: responseCached, grounded } = await generateStudentAnswer({
            query,
            context,
            detectedSubject,
            userId: req.user._id,
        });

        return res.success({
            answer,
            metadata: {
                detectedSubject,
                confidence,
                chunksUsed: context.length,
                grounded,
                fromCache: retrievalCached && responseCached,
                totalMs: Date.now() - start,
            },
        });
    } catch (error) {
        ragLogger.error('POST /api/query failed', error);
        return res.error(error.message);
    }
};

router.post('/query-legacy', protect, handleQuery);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rag/upload   (legacy route — kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload',
    protect,
    authorize('faculty', 'admin'),
    upload.single('file'),
    async (req, res) => {
        try {
            const { subject, topic, sourceType, unit, replace } = req.body;
            if (!req.file || !subject || !sourceType) {
                return res.error('file, subject, and sourceType are required.', 400);
            }

            const stats = await ingestDocument({
                buffer: req.file.buffer,
                originalName: req.file.originalname,
                subject,
                topic,
                unit,
                sourceType,
                replace: replace === 'true',
            });

            return res.success(
                { chunks: stats.indexed, skipped: stats.skipped, durationMs: stats.durationMs },
                `Document ingested and vectorized successfully (${stats.indexed} chunks).`
            );
        } catch (error) {
            ragLogger.error('POST /upload failed', error);
            return res.error(error.message);
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rag/search   (raw retrieval — no LLM generation)
// @desc   Return top-K context chunks without generating an answer
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/search', protect, async (req, res) => {
    try {
        const { query, subject, topK, sourceType } = req.body;
        if (!query) return res.error('query is required.', 400);

        const result = await retrieve(query, {
            userId: req.user._id,
            subjectHint: subject,
            topK: Math.min(Number(topK) || 5, 10),
            sourceType,
        });

        return res.success(result);
    } catch (error) {
        ragLogger.error('POST /search failed', error);
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rag/query    (full RAG — classify + retrieve + generate)
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/query', protect, handleQuery);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rag/classify
// @desc   Test the topic classifier for a query
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/classify', protect, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.error('query is required.', 400);

        const result = await classifyTopic(query);
        return res.success(result);
    } catch (error) {
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rag/documents
// @desc   List all ingested documents
// @access Faculty / Admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/documents', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const docs = await listDocuments();
        return res.success(docs);
    } catch (error) {
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/rag/documents/:fileName
// @desc   Remove all chunks for a specific document
// @access Faculty / Admin
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/documents/:fileName', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { subject } = req.query;
        const count = await deleteDocument(req.params.fileName, subject);
        return res.success({ deleted: count }, `Removed ${count} chunks for "${req.params.fileName}".`);
    } catch (error) {
        return res.error(error.message);
    }
});

export default router;
