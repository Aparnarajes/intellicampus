import express from 'express';
import dotenv from 'dotenv';
import { protect, authorize } from '../middlewares/auth.js';
import ChatHistory from '../models/ChatHistory.js';
import { questionBank } from '../data/syllabusData.js';
import { callGeminiRest } from '../utils/aiHelper.js';
import CRService from '../services/cr.service.js';
import * as AiService from '../services/ai.service.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.js';
import { validate, doubtSchema, noteGenSchema } from '../middlewares/validator.js';
import * as StudyPlannerService from '../services/studyPlanner.service.js';
import MockTestResult from '../models/MockTestResult.js';

dotenv.config();

const router = express.Router();
router.use(aiRateLimiter);

// ─────────────────────────────────────────────────────────────────
// @route   GET /api/ai/study-plan
// @access  Private (Student Only)
// ─────────────────────────────────────────────────────────────────
router.get('/study-plan', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.error('Study plans are available for students only.', 403);
        }
        const plan = await StudyPlannerService.getLatestStudyPlan(req.user);
        return res.success(plan);
    } catch (error) {
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────
// Helper: identify syllabus context from a chat message
// ─────────────────────────────────────────────────────────────────
const getRelevantSyllabus = (message) => {
    const lowerMessage = message.toLowerCase();
    let foundSubject = null;

    for (const [code, data] of Object.entries(questionBank)) {
        if (
            lowerMessage.includes(code.toLowerCase()) ||
            lowerMessage.includes(data.title.toLowerCase())
        ) {
            foundSubject = data;
            break;
        }
        for (let i = 1; i <= 5; i++) {
            const unit = `Unit ${i}`;
            if (data[unit] && data[unit].some(topic => lowerMessage.includes(topic.toLowerCase()))) {
                foundSubject = data;
                break;
            }
        }
        if (foundSubject) break;
    }

    if (foundSubject) {
        let syllabusInfo = `Syllabus Context for ${foundSubject.title}:\n`;
        for (let i = 1; i <= 5; i++) {
            const unit = `Unit ${i}`;
            if (foundSubject[unit]) {
                syllabusInfo += `- ${unit}: ${foundSubject[unit].join(', ')}\n`;
            }
        }
        return syllabusInfo;
    }
    return '';
};

// ─────────────────────────────────────────────────────────────────
// @route   GET  /api/ai/history
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
    try {
        const history = await ChatHistory.findOne({ user: req.user._id });
        return res.success(history);
    } catch (error) {
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   DELETE /api/ai/history
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.delete('/history', protect, async (req, res) => {
    try {
        await ChatHistory.findOneAndDelete({ user: req.user._id });
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/chat
// @access  Private (Student Only for CR Bot)
// ─────────────────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
    const { message, history: clientHistory } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        if (!apiKey) throw new Error('API Key missing in .env');

        // Check if user is student for CR Bot features
        if (req.user.role !== 'student') {
            // General AI for faculty/admin
            const systemPrompt = `You are the IntelliCampus AI Assistant for ${req.user.role}. Respond professionally.`;
            const responseText = await callGeminiRest(message, clientHistory, systemPrompt);
            return res.json({ success: true, message: responseText });
        }

        // Student-specific CR Bot Logic
        const crResponse = await CRService.handleCRRequest(req.user, message, clientHistory);

        // Save to history
        let history = await ChatHistory.findOne({ user: req.user._id });
        if (!history) history = new ChatHistory({ user: req.user._id, messages: [] });

        history.messages.push({ role: 'user', content: message });

        let displayMessage = crResponse.content;
        if (crResponse.type === 'notes') {
            displayMessage = `I've generated the notes for you:\n\n${crResponse.content}`;
        }

        history.messages.push({
            role: 'assistant',
            content: displayMessage,
            cardType: crResponse.cardType,
            cardData: crResponse.data,
            responseType: crResponse.type
        });

        if (history.messages.length > 50) {
            history.messages = history.messages.slice(-50);
        }
        await history.save();

        return res.json({
            success: true,
            message: displayMessage,
            data: crResponse.data,
            cardType: crResponse.cardType,
            responseType: crResponse.type
        });

    } catch (error) {
        console.error('CHAT ERROR:', error.message);
        res.json({
            success: true,
            message: `🤖 CR Note: ${error.message}. I'm having a bit of trouble connecting to the neural network.`,
        });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/doubt
// @desc    Tutor Mode: Structured doubt solving with difficulty adaptation.
// @access  Private (Student Only)
// ─────────────────────────────────────────────────────────────────
router.post('/doubt', protect, validate(doubtSchema), async (req, res) => {
    const { question, history } = req.body;

    try {
        if (req.user.role !== 'student') {
            return res.error('Tutor mode is available for students only.', 403);
        }

        const tutorResponse = await CRService.solveDoubtWithTutorMode(req.user, question, history);
        return res.success(tutorResponse, tutorResponse.content);
    } catch (error) {
        console.error('DOUBT ERROR:', error.message);
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/generate-notes          ← CACHED ✅
// @desc    Generate AI study notes for a subject unit.
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/generate-notes', protect, validate(noteGenSchema), async (req, res) => {
    const { subjectCode, unit, prompt, modelName } = req.body;
    try {
        const { result, metadata, fromCache } = await AiService.generateAINotes({
            userId: req.user._id,
            role: req.user.role,
            subjectCode,
            unit,
            prompt,
            modelName,
        });
        return res.success({ result, fromCache, cacheMetadata: metadata }, result);
    } catch (error) {
        return res.error(error.message);
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/generate-mocktest        ← CACHED ✅
// @desc    Generate MCQ mock-test questions from notes content.
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/generate-mocktest', protect, async (req, res) => {
    const { subjectCode, unit, prompt, modelName } = req.body;
    if (!subjectCode || !unit || !prompt) {
        return res.status(400).json({ success: false, message: 'subjectCode, unit, and prompt are required.' });
    }
    try {
        const { result, metadata, fromCache } = await AiService.generateMockTest({
            userId: req.user._id,
            role: req.user.role,
            subjectCode,
            unit,
            prompt,
            modelName,
        });
        let mcqs;
        try {
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            const jsonStr = jsonMatch ? jsonMatch[0] : result.trim();
            mcqs = JSON.parse(jsonStr);
        } catch {
            mcqs = null;
        }
        return res.json({ success: true, mcqs, rawResponse: result, fromCache, cacheMetadata: metadata });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/attendance-insight
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/attendance-insight', protect, async (req, res) => {
    const { stats } = req.body;
    try {
        const prompt = `Analyze this student's attendance data and provide a short, proactive insight (max 2 sentences).\nOverall Percentage: ${stats.overall}%\nTotal Absences: ${stats.totalAbsents}\nDay-wise Absences: ${JSON.stringify(stats.dayWiseAbsences)}\nSubject-wise Status: ${JSON.stringify(stats.subjectWise)}`;
        const responseText = await callGeminiRest(prompt, [], 'You are a helpful academic advisor.');
        res.json({ success: true, insight: responseText });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/recommend-skills
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/recommend-skills', protect, async (req, res) => {
    const { interests, skills } = req.body;
    try {
        const prompt = `Based on the following student profile, recommend 5 key skills they should learn.\nInterests: ${interests || 'General CS'}\nCurrent Skills: ${skills?.join(', ') || 'Entry Level'}\nRole: ${req.user.role}`;
        const responseText = await callGeminiRest(prompt, [], 'You are a career counselor.');
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const recommended = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        res.json({ success: true, recommendations: recommended });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/invalidate-cache
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/invalidate-cache', protect, async (req, res) => {
    try {
        const deleted = await AiService.invalidateUserCache(req.user._id);
        res.json({ success: true, message: `Cache invalidated. ${deleted} key(s) cleared.`, deletedCount: deleted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────
// @route   POST /api/ai/submit-mocktest
// @desc    Submit results of an AI-generated mock test.
// @access  Private
// ─────────────────────────────────────────────────────────────────
router.post('/submit-mocktest', protect, async (req, res) => {
    try {
        const { subject, topic, totalQuestions, correctAnswers, incorrectQuestions } = req.body;

        const score = (correctAnswers / totalQuestions) * 100;

        const result = new MockTestResult({
            student: req.user._id,
            subject,
            topic,
            totalQuestions,
            correctAnswers,
            incorrectQuestions,
            score
        });

        await result.save();

        return res.success(result, 'Mock test results saved successfully.');
    } catch (error) {
        return res.error(error.message);
    }
});

export default router;
