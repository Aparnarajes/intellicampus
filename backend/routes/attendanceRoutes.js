import express from 'express';
import {
    markAttendance,
    markAttendanceBatch,
    getMyAttendance,
    getStudentAttendance,
    getBatchAttendance,
    getSessionAttendance,
    getAttendanceDates,
    updateAttendanceRecord,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, markAttendanceSchema, markAttendanceBatchSchema } from '../middlewares/validator.js';

const router = express.Router();

router.use(protect);

// Student routes
router.get('/me', getMyAttendance);

// Faculty / Admin routes
router.post('/', authorize('faculty', 'admin'), validate(markAttendanceSchema), markAttendance);
router.post('/batch', authorize('faculty', 'admin'), validate(markAttendanceBatchSchema), markAttendanceBatch);
router.get('/student/:studentId', authorize('faculty', 'admin'), getStudentAttendance);
router.get('/batch', authorize('faculty', 'admin'), getBatchAttendance);
router.get('/session', authorize('faculty', 'admin'), getSessionAttendance);
router.get('/dates', authorize('faculty', 'admin'), getAttendanceDates);
router.put('/:id', authorize('faculty', 'admin'), updateAttendanceRecord);

export default router;
