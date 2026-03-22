import express from 'express';
import { getDepartments, updateDepartment, seedDepartments, createDepartment } from '../controllers/departmentController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDepartments);
router.post('/', authorize('admin'), createDepartment);
router.post('/seed', authorize('admin'), seedDepartments);
router.put('/:id', authorize('admin'), updateDepartment);

export default router;
