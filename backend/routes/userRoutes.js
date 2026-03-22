import express from 'express';
import {
    getStudents, getFaculty, deleteUser, getDashboardStats,
    getFacultyStats, getProfile, updateProfile, getUserById,
    updateUserById, getAnnouncements
} from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, updateProfileSchema } from '../middlewares/validator.js';

import { listEvents } from '../controllers/eventController.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/announcements', getAnnouncements);
router.get('/events', listEvents);

router.get('/students', authorize('admin', 'faculty'), getStudents);
router.get('/faculty', authorize('admin'), getFaculty);
router.get('/stats', authorize('admin'), getDashboardStats);
router.get('/faculty-stats', authorize('faculty'), getFacultyStats);

// Dynamic routes
router.get('/:id', authorize('admin', 'faculty'), getUserById);
router.put('/:id', authorize('admin', 'faculty'), validate(updateProfileSchema), updateUserById);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
