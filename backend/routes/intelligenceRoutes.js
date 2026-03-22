import express from 'express';
import * as AiService from '../services/ai.service.js';
import { protect, authorize } from '../middlewares/auth.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(aiRateLimiter);
router.use(protect);

// @route   GET  /api/intelligence/predictive-score
router.get('/predictive-score', async (req, res) => {
    try {
        const stats = await AiService.getStudentPredictiveAnalytics(req.user.id, req.user);
        return res.success(stats);
    } catch (error) {
        return res.error(error.message);
    }
});

// @route   GET  /api/intelligence/batch-patterns/:batch
router.get('/batch-patterns/:batch', authorize('faculty', 'admin'), async (req, res) => {
    try {
        const insight = await AiService.getBatchIntelligence(req.params.batch);
        return res.success({ insight });
    } catch (error) {
        return res.error(error.message);
    }
});

// @route   POST /api/intelligence/invalidate-cache
router.post('/invalidate-cache', async (req, res) => {
    try {
        const deleted = await AiService.invalidateUserCache(req.user.id);
        return res.success({ deletedCount: deleted }, `Cache invalidated. ${deleted} key(s) removed.`);
    } catch (error) {
        return res.error(error.message);
    }
});

export default router;
