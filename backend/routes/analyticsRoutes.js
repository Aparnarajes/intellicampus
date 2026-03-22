import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import * as AnalyticsService from '../services/analytics.service.js';
import * as TopicAnalyticsService from '../services/topicAnalytics.service.js';
import * as PersonalLearningService from '../services/personalLearning.service.js';

const router = express.Router();

router.use(protect);

// Student Specific Analytics
router.get('/student/roadmap', async (req, res) => {
    try {
        const data = await PersonalLearningService.getPersonalizedRoadmap(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});
router.get('/student/attendance-trend', async (req, res) => {
    try {
        const data = await AnalyticsService.getStudentAttendanceTrend(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/advanced-dashboard', async (req, res) => {
    try {
        const studentId = req.user.prismaId;
        if (!studentId) {
            return res.error('Scholastic identity not resolved. Please complete profile setup.', 404);
        }
        const data = await AnalyticsService.getAdvancedStudentDashboard(studentId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/performance', async (req, res) => {
    try {
        const data = await AnalyticsService.getSubjectWisePerformance(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/prediction', async (req, res) => {
    try {
        const data = await AnalyticsService.getStudentPrediction(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/analytics', async (req, res) => {
    try {
        const data = await AnalyticsService.getAdvancedStudentDashboard(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/progress', async (req, res) => {
    try {
        const data = await AnalyticsService.getSubjectWisePerformance(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/weak-topics', async (req, res) => {
    try {
        await TopicAnalyticsService.updateTopicPerformace(req.user.prismaId);
        const data = await TopicAnalyticsService.getWeakTopics(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/recommendations', async (req, res) => {
    try {
        const data = await TopicAnalyticsService.getTopicRecommendations(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/student/profile', async (req, res) => {
    try {
        const data = await AnalyticsService.updateStudentPerformanceProfile(req.user.prismaId);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

// Faculty/Admin Analytics
router.get('/batch/weak-students', authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { batch } = req.query;
        const data = await AnalyticsService.getWeakStudentsPerSubject(batch);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/batch/heatmap', authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { batch } = req.query;
        const data = await AnalyticsService.getClassHeatmap(batch);
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/academic-intelligence', authorize('faculty', 'admin'), async (req, res) => {
    try {
        const data = await AnalyticsService.getAcademicIntelligence();
        return res.success(data);
    } catch (error) {
        return res.error(error.message);
    }
});

router.get('/export-intelligence', authorize('faculty', 'admin'), async (req, res) => {
    try {
        const data = await AnalyticsService.getAcademicIntelligence();

        // Simple CSV generation
        let csv = 'Type,Name/Subject,Detail,Value\n';

        data.attendanceRisk.forEach(s => {
            csv += `Attendance Risk,${s.name},${s.usn},${s.percent}%\n`;
        });

        data.subjectDifficulty.forEach(s => {
            csv += `Failure Probability,${s.subject},Avg Score,${s.avgScore}%\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=academic_intelligence.csv');
        return res.status(200).send(csv);
    } catch (error) {
        return res.error(error.message);
    }
});


export default router;
