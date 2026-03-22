import { calculateEmbedding, callGeminiRest } from '../utils/aiHelper.js';
import { ragLogger } from '../utils/logger.js';

/**
 * ───────────────────────────────────────────────────────────────────────────────
 * TopicClassifier
 * ───────────────────────────────────────────────────────────────────────────────
 * Classifies a student query into an academic subject using a two-stage
 * approach for maximum accuracy:
 *
 *   Stage 1 – Embedding Similarity  (fast, no LLM call, no latency)
 *     • Cosine similarity between query embedding and subject-label embeddings.
 *     • If top result confidence ≥ EMBED_THRESHOLD → use it directly.
 *
 *   Stage 2 – LLM Classification    (authoritative, used when Stage 1 is uncertain)
 *     • Send structured prompt to Gemini.
 *     • Parse JSON response → { subject, confidence }.
 *
 * Exports:
 *   classifyTopic(query: string) → Promise<{ subject: string, confidence: number }>
 * ───────────────────────────────────────────────────────────────────────────────
 */

// ─── Subject Catalog ──────────────────────────────────────────────────────────
// Each entry has a canonical name + description phrases used for embedding similarity.
const SUBJECT_CATALOG = [
    {
        subject: 'Operating Systems',
        labels: ['operating systems process scheduling deadlock memory management virtual memory file system'],
    },
    {
        subject: 'Database Management Systems',
        labels: ['database dbms sql normalization transactions er diagram relational algebra indexing'],
    },
    {
        subject: 'Computer Networks',
        labels: ['computer networks tcp ip routing protocols osi model http dns ethernet wireless'],
    },
    {
        subject: 'Data Structures and Algorithms',
        labels: ['data structures algorithms sorting searching trees graphs stacks queues linked list hashing'],
    },
    {
        subject: 'Mathematics',
        labels: ['mathematics calculus linear algebra probability statistics differentiation integration matrices'],
    },
    {
        subject: 'Object Oriented Programming',
        labels: ['object oriented programming java python classes inheritance polymorphism encapsulation abstraction'],
    },
    {
        subject: 'Software Engineering',
        labels: ['software engineering sdlc agile scrum uml design patterns testing requirements'],
    },
    {
        subject: 'Web Development',
        labels: ['web development html css javascript react node express rest api frontend backend'],
    },
    {
        subject: 'Machine Learning',
        labels: ['machine learning neural networks deep learning classification regression clustering model training'],
    },
    {
        subject: 'Computer Architecture',
        labels: ['computer organization architecture cpu pipeline instruction set alu registers memory hierarchy'],
    },
    {
        subject: 'Theory of Computation',
        labels: ['theory of computation automata regular expressions context free grammar turing machine complexity'],
    },
    {
        subject: 'General',
        labels: ['general academic study question help explain concept'],
    },
];

// ─── Cosine Similarity ────────────────────────────────────────────────────────
const cosine = (a, b) => {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// ─── Threshold for embedding-based classification ─────────────────────────────
const EMBED_THRESHOLD = 0.82;

// ─── In-memory cache for subject label embeddings ─────────────────────────────
// Populated once on first use; reused for all subsequent classifications.
let _labelEmbeddings = null;

async function getLabelEmbeddings() {
    if (_labelEmbeddings) return _labelEmbeddings;

    ragLogger.log('CLASSIFY_INIT', { msg: 'Computing subject label embeddings (one-time)' });
    _labelEmbeddings = await Promise.all(
        SUBJECT_CATALOG.map(async ({ subject, labels }) => ({
            subject,
            embedding: await calculateEmbedding(labels[0]),
        }))
    );
    return _labelEmbeddings;
}

// ─── Stage 1: Embedding similarity ───────────────────────────────────────────
async function classifyByEmbedding(query) {
    const queryEmbedding = await calculateEmbedding(query);
    const labelEmbeddings = await getLabelEmbeddings();

    let best = { subject: 'General', confidence: 0 };
    for (const { subject, embedding } of labelEmbeddings) {
        const sim = cosine(queryEmbedding, embedding);
        if (sim > best.confidence) {
            best = { subject, confidence: parseFloat(sim.toFixed(4)) };
        }
    }
    return best;
}

// ─── Stage 2: LLM classification ─────────────────────────────────────────────
async function classifyByLLM(query) {
    const subjectNames = SUBJECT_CATALOG.map(s => s.subject).join(', ');
    const prompt = `You are an academic subject classifier for an engineering university.

Classify the following student query into exactly ONE of these subjects:
${subjectNames}

Student Query: "${query}"

Rules:
- Choose the single best matching subject
- If not academic, return "General"
- Respond ONLY with raw JSON, no markdown

Expected JSON format:
{"subject": "Operating Systems", "confidence": 0.95}`;

    const raw = await callGeminiRest(prompt, [], 'Academic Subject Classifier');
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
        subject: parsed.subject || 'General',
        confidence: parseFloat((parsed.confidence || 0.5).toFixed(4)),
    };
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Classify a student query into an academic subject.
 *
 * @param {string} query - The raw student query
 * @returns {Promise<{ subject: string, confidence: number }>}
 */
export const classifyTopic = async (query) => {
    const start = Date.now();

    try {
        // Stage 1: Try fast embedding similarity first
        const embeddingResult = await classifyByEmbedding(query);

        if (embeddingResult.confidence >= EMBED_THRESHOLD) {
            ragLogger.log('CLASSIFY', {
                query: query.slice(0, 60),
                stage: 'embedding',
                subject: embeddingResult.subject,
                confidence: embeddingResult.confidence,
                durationMs: Date.now() - start,
            });
            return embeddingResult;
        }

        // Stage 2: Fall back to LLM for ambiguous queries
        const llmResult = await classifyByLLM(query);
        ragLogger.log('CLASSIFY', {
            query: query.slice(0, 60),
            stage: 'llm',
            subject: llmResult.subject,
            confidence: llmResult.confidence,
            embeddingFallbackScore: embeddingResult.confidence,
            durationMs: Date.now() - start,
        });
        return llmResult;

    } catch (err) {
        ragLogger.error('classifyTopic failed', err);
        // Graceful degradation: return best-effort embedding result or General
        return { subject: 'General', confidence: 0 };
    }
};

export { SUBJECT_CATALOG };
