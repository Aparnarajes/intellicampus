import axios from 'axios';
import logger from './logger.js';
import { callGeminiRest } from './aiHelper.js';

/**
 * AI Service Proxy — Industry Standard Microservice Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes requests to specialized Python ML/NLP microservices if available,
 * otherwise falls back to the primary LLM (Gemini).
 * ─────────────────────────────────────────────────────────────────────────────
 */

class AIServiceProxy {
    constructor() {
        // Updated to use a more explicit name consistent with the new Python services
        this.pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
    }

    /**
     * Specialized Classification (NLP)
     */
    async classifyIntent(text) {
        if (this.pythonServiceUrl) {
            try {
                const res = await axios.post(`${this.pythonServiceUrl}/classify`, { text }, { timeout: 3000 });
                if (res.data.success) return { intent: res.data.intent, src: 'PYTHON_ML' };
            } catch (err) {
                logger.warn(`Python ML Service unreachable: ${err.message}. Falling back to Gemini.`);
            }
        }

        const prompt = `Identify the intent of this academic query: "${text}". 
        Options: [ACADEMIC_QUERY, ADMINISTRATIVE, GENERAL, DOUBT, NOTES_GEN]. 
        Respond with ONLY the JSON: {"intent": "..."}`;
        
        const responseText = await callGeminiRest(prompt, [], "Intent Classifier");
        try {
            const clean = responseText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);
            return { ...parsed, src: 'GEMINI_LLM' };
        } catch (e) {
            return { intent: 'GENERAL', src: 'FALLBACK' };
        }
    }

    /**
     * Note Generation Service (AI Microservice)
     */
    async generateNotes(topic, detailLevel = 'standard') {
        if (this.pythonServiceUrl) {
            try {
                const res = await axios.post(`${this.pythonServiceUrl}/notes`, { topic, detail_level: detailLevel }, { timeout: 15000 });
                if (res.data.success) return res.data.notes;
            } catch (err) {
                logger.warn(`Python Notes Microservice offline: ${err.message}.`);
            }
        }
        return null; // Let the caller handle Gemini fallback if needed
    }

    /**
     * Keyword Extraction Service
     */
    async extractKeywords(text) {
        if (this.pythonServiceUrl) {
            try {
                const res = await axios.post(`${this.pythonServiceUrl}/keywords`, { text }, { timeout: 5000 });
                if (res.data.success) return res.data.keywords;
            } catch (err) {
                logger.error(`AI Keyword Extraction failed: ${err.message}`);
            }
        }
        return [];
    }

    /**
     * Fast Similarity Calculation
     */
    async calculateSimilarity(text1, text2) {
        if (this.pythonServiceUrl) {
            try {
                const res = await axios.post(`${this.pythonServiceUrl}/similarity`, { text1, text2 }, { timeout: 2000 });
                if (res.data.success) return res.data.score;
            } catch (err) {
                logger.warn(`Similarity microservice failed: ${err.message}`);
            }
        }
        return 0.5; // Neutral fallback
    }

    /**
     * Performance Forecasting (Regression/ML)
     */
    async predictFailureRisk(studentVector) {
        // This is a specialized ML endpoint that should be added to the Python service
        if (this.pythonServiceUrl) {
            try {
                const res = await axios.post(`${this.pythonServiceUrl}/predict-risk`, studentVector, { timeout: 5000 });
                return res.data;
            } catch (err) {
                logger.warn(`Python Prediction Microservice Offline. Falling back to Heuristic Model.`);
            }
        }

        // HEURISTIC FALLBACK
        const { avgMarks, attendanceRate } = studentVector;
        const risk = (avgMarks < 40 || attendanceRate < 70) ? 'HIGH' : (avgMarks < 60 || attendanceRate < 80) ? 'MEDIUM' : 'LOW';
        return { risk, probability: avgMarks < 40 ? 0.85 : 0.15 };
    }
}

export default new AIServiceProxy();
