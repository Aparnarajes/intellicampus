import express from 'express';
import { getStudentDashboard, getMyProfile } from '../controllers/studentController.js';
import { updateProfile } from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, updateProfileSchema } from '../middlewares/validator.js';

const router = express.Router();

// Student can only view their OWN data
router.get('/dashboard', protect, authorize('student'), getStudentDashboard);
router.get('/profile', protect, authorize('student'), getMyProfile);
router.put('/update-profile', protect, authorize('student'), validate(updateProfileSchema), updateProfile);

export default router;
