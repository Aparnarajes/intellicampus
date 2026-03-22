import express from 'express';
import { getMarks, saveMarks, getMarksAnalysis, getStudentMarks } from '../controllers/marksController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, saveMarksSchema } from '../middlewares/validator.js';

const router = express.Router();

// All marks routes require authentication
router.use(protect);

// Student specific route
router.get('/my-marks', getStudentMarks);

// Faculty & Admin specific routes
router.use(authorize('faculty', 'admin'));
router.get('/', getMarks);
router.post('/save', validate(saveMarksSchema), saveMarks);
router.get('/analysis', getMarksAnalysis);

export default router;
