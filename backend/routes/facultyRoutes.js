import express from 'express';
import {
    getMySubjects,
    markAttendance,
    updateMarks,
    createAssignment,
    gradeAssignment,
    getAssignmentSubmissions,
    getStudents,
    getStudentsBySubject,
    getAttendanceDates,
    getSessionAttendance,
    updateAttendanceRecord,
} from '../controllers/facultyController.js';
import { markAttendanceBatch } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All faculty routes require authentication + faculty/admin role
router.use(protect, authorize('faculty', 'admin'));

// ── Subjects ──────────────────────────────────────────────────────────────────
router.get('/subjects', getMySubjects);

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students', getStudents);
router.get('/students-by-subject', getStudentsBySubject);

// ── Attendance ────────────────────────────────────────────────────────────────
// Single record (backward compat)
router.post('/attendance', markAttendance);
// Batch save (preferred — one call for whole class)
router.post('/attendance/batch', markAttendanceBatch);
// Queries
router.get('/attendance/dates', getAttendanceDates);
router.get('/attendance/session', getSessionAttendance);
router.put('/attendance/:id', updateAttendanceRecord);

// ── Marks ─────────────────────────────────────────────────────────────────────
// Single update (backward compat)
router.patch('/marks', updateMarks);

// ── Assignments ───────────────────────────────────────────────────────────────
router.post('/assignments', createAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.patch('/assignments/:assignmentId/grade/:studentId', gradeAssignment);

export default router;
