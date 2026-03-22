import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/auth.js';
import { adminRateLimiter } from '../middlewares/rateLimiter.js';
import {
    addStudent, bulkImportStudents, bulkDeleteStudents, exportStudentsCSV,
    addFaculty, bulkImportFaculty,
    listStudents, listFaculty,
    toggleUserAccount, getAdminStats,
    updateFacultyAssignments, getSystemHealth,
    updateStudent, deleteStudent,
    updateFaculty, deleteFaculty
} from '../controllers/adminController.js';

const router = express.Router();

// CSV upload: memory storage, max 5MB, CSV only
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are accepted for bulk import.'), false);
        }
    },
});

// All admin routes require JWT + admin role + rate limiting
router.use(protect, authorize('admin'), adminRateLimiter);

// ── Stats Dashboard ────────────────────────────────────────────────────────────
router.get('/stats', getAdminStats);
router.get('/health', getSystemHealth);

// ── Student Management ─────────────────────────────────────────────────────────
router.route('/students')
    .get(listStudents)
    .post(addStudent);

router.route('/students/:id')
    .put(updateStudent)
    .delete(deleteStudent);

router.post('/students/bulk', csvUpload.single('csv'), bulkImportStudents);
router.post('/students/bulk-delete', bulkDeleteStudents);
router.get('/students/export', exportStudentsCSV);

// ── Faculty Management ─────────────────────────────────────────────────────────
router.route('/faculty')
    .get(listFaculty)
    .post(addFaculty);

router.route('/faculty/:id')
    .patch(updateFaculty)
    .delete(deleteFaculty);

router.post('/faculty/bulk', csvUpload.single('csv'), bulkImportFaculty);

router.patch('/faculty/:id/assignments', updateFacultyAssignments);

// ── Account Control ────────────────────────────────────────────────────────────
router.patch('/users/:id/toggle', toggleUserAccount);

export default router;
