import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/auth.js';
import {
  createQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  importQuestionsCsv,
} from '../controllers/questionBankController.js';

const router = express.Router();

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files are accepted.'), false);
  },
});

router.use(protect, authorize('faculty', 'admin'));

router.get('/questions', listQuestions);
router.post('/questions', createQuestion);
router.patch('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

router.post('/import/csv', csvUpload.single('csv'), importQuestionsCsv);

export default router;

