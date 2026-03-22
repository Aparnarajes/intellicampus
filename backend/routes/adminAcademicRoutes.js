import express from 'express';
import {
    assignFacultyToSubject,
    getAcademicAnalytics,
    listSubjects,
    createSubject,
    deleteSubject,
    updateSubject,
    listCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
    updateCalendarEvent,
    listAnnouncements,
    createAnnouncement,
    deleteAnnouncement
} from '../controllers/adminAcademicController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/assign-faculty', assignFacultyToSubject);
router.get('/analytics', getAcademicAnalytics);

// Subjects
router.get('/subjects', listSubjects);
router.post('/subjects', createSubject);
router.delete('/subjects/:id', deleteSubject);
router.patch('/subjects/:id', updateSubject);

// Calendar
router.get('/calendar', listCalendarEvents);
router.post('/calendar', createCalendarEvent);
router.delete('/calendar/:id', deleteCalendarEvent);
router.patch('/calendar/:id', updateCalendarEvent);

// Announcements
router.get('/announcements', listAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

export default router;
