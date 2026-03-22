import express from 'express';
import { protect } from '../middlewares/auth.js';
import { validate, generatePaperSchema, recordAttemptsSchema } from '../middlewares/validator.js';
import * as AdaptiveService from '../services/adaptive.service.js';
import {
    generatePaper,
    listMyPapers,
    getPaperById,
    deletePaperById,
    recordAttempts,
} from '../controllers/adaptiveEngineController.js';

const router = express.Router();

router.use(protect);

router.get('/profile', async (req, res) => {
    try {
        const profile = await AdaptiveService.computeStudentProfile(req.user.id);
        const { dist, flags, adaptationSummary } = AdaptiveService.computeDistribution(profile, '', 15);

        return res.success({
            profile: {
                overallAvgPct: profile.overallAvgPct,
                recentAvg: profile.recentAvg,
                attendanceRate: profile.overallAttendancePct,
                last5ScoresPct: profile.last5ScoresPct,
                weakSubjects: profile.weakSubjects,
                strongSubjects: profile.strongSubjects,
                lowAttendanceSubjects: profile.lowAttendanceSubjects,
                subjectMap: profile.subjectMap,
            },
            defaultDistribution: dist,
            adaptationFlags: flags,
            adaptationSummary,
        });
    } catch (err) {
        return res.error(err.message);
    }
});

router.post('/generate', validate(generatePaperSchema), async (req, res) => {
    // Legacy endpoint kept for backward compatibility.
    // Now uses the production DB-backed Adaptive Engine.
    return generatePaper(req, res);
});

// New production endpoints
router.post('/papers/generate', validate(generatePaperSchema), generatePaper);
router.get('/papers', listMyPapers);
router.get('/papers/:id', getPaperById);
router.delete('/papers/:id', deletePaperById);
router.post('/attempts', validate(recordAttemptsSchema), recordAttempts);

router.get('/distribution-preview', async (req, res) => {
    try {
        const { subjectTitle = '', totalQuestions = 15 } = req.query;

        const profile = await AdaptiveService.computeStudentProfile(req.user.id);
        const { dist, flags, adaptationSummary } = AdaptiveService.computeDistribution(
            profile,
            subjectTitle,
            Number(totalQuestions)
        );

        return res.success({
            distribution: dist,
            adaptationFlags: flags,
            adaptationSummary,
        });
    } catch (err) {
        return res.error(err.message);
    }
});

export default router;
