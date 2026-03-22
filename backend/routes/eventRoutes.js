import express from 'express';
import { createEvent, updateEvent, deleteEvent, listEvents } from '../controllers/eventController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @desc    Public (Read-Only) routes for logged-in students/faculty/admin
 * @route   /api/events
 */
router.get('/', protect, listEvents);

/**
 * @desc    Admin-Only management routes
 * @route   /api/admin/events
 */
// Use /api/admin/events/create etc as per requirement
// Or, if registered at /api, then the base is /admin/events
// Example: app.use('/api', eventRoutes); 
// We'll expose them as requested (/api/admin/events/create, etc.)

router.post('/admin/events/create', protect, authorize('admin'), createEvent);
router.put('/admin/events/:eventId/update', protect, authorize('admin'), updateEvent);
router.delete('/admin/events/:eventId/delete', protect, authorize('admin'), deleteEvent);

export default router;
