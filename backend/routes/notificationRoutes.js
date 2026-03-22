import express from 'express';
import { protect } from '../middlewares/auth.js';
import NotificationService from '../services/notification.service.js';
import CRService from '../services/cr.service.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await NotificationService.getUnread(req.user.id);
        return res.success({ notifications });
    } catch (error) {
        return res.error(error.message);
    }
});

// @route   GET /api/notifications/proactive
// ⚠️ MUST be defined BEFORE /:id to avoid Express matching "proactive" as an id
router.get('/proactive', async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.success(null);
        }
        const proactive = await CRService.getProactiveWarnings(req.user);
        return res.success(proactive);
    } catch (error) {
        return res.error(error.message);
    }
});

// @route   PATCH /api/notifications/:id
router.patch('/:id', async (req, res) => {
    try {
        await NotificationService.markAsRead(req.params.id);
        return res.success(null, 'Notification marked as read');
    } catch (error) {
        return res.error(error.message);
    }
});

export default router;
