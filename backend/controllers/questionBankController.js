import prisma from '../config/prisma.js';
import { parse as csvParse } from 'csv-parse/sync';
import logger from '../utils/logger.js';

const DIFFICULTY = new Set(['EASY', 'MEDIUM', 'HARD']);
const BLOOM = new Set(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']);
const QTYPE = new Set(['MCQ', 'SHORT_ANSWER', 'DESCRIPTIVE']);

function normEnum(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, '_');
}

export const createQuestion = async (req, res) => {
  try {
    const {
      subjectCode,
      unit,
      topic,
      questionText,
      questionType,
      difficulty,
      bloomLevel,
      marks,
      optionsJson,
      answerKey,
    } = req.body;

    const subject = await prisma.subject.findUnique({ where: { subjectCode } });
    if (!subject) return res.error(`Subject "${subjectCode}" not found.`, 404);

    const qType = normEnum(questionType);
    const diff = normEnum(difficulty);
    const bloom = normEnum(bloomLevel);

    if (!QTYPE.has(qType)) return res.error('Invalid questionType.', 400);
    if (!DIFFICULTY.has(diff)) return res.error('Invalid difficulty.', 400);
    if (!BLOOM.has(bloom)) return res.error('Invalid bloomLevel.', 400);

    const created = await prisma.question.create({
      data: {
        subjectId: subject.id,
        unit: String(unit).trim(),
        topic: String(topic).trim(),
        questionText: String(questionText).trim(),
        questionType: qType,
        difficulty: diff,
        bloomLevel: bloom,
        marks: Number(marks),
        optionsJson: optionsJson ? String(optionsJson) : null,
        answerKey: answerKey ? String(answerKey) : null,
      }
    });

    logger.info(`[QUESTION_BANK] Question created by ${req.user.email}`, { id: created.id, subjectCode });
    return res.success(created, 'Question added to question bank.', 201);
  } catch (err) {
    return res.error(err.message, 500);
  }
};

export const listQuestions = async (req, res) => {
  try {
    const {
      subjectCode,
      unit,
      topic,
      difficulty,
      bloomLevel,
      questionType,
      isActive = 'true',
      page = 1,
      limit = 50,
    } = req.query;

    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      isActive: isActive !== 'false',
    };

    if (subjectCode) {
      const subject = await prisma.subject.findUnique({ where: { subjectCode: String(subjectCode) } });
      if (!subject) return res.success({ questions: [], total: 0, page: Number(page), pages: 0 });
      where.subjectId = subject.id;
    }
    if (unit) where.unit = { contains: String(unit) };
    if (topic) where.topic = { contains: String(topic) };
    if (difficulty) where.difficulty = normEnum(difficulty);
    if (bloomLevel) where.bloomLevel = normEnum(bloomLevel);
    if (questionType) where.questionType = normEnum(questionType);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.question.count({ where }),
    ]);

    return res.success({ questions, total, page: Number(page), pages: Math.ceil(total / take) });
  } catch (err) {
    return res.error(err.message);
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = { ...req.body };

    if (patch.questionType) patch.questionType = normEnum(patch.questionType);
    if (patch.difficulty) patch.difficulty = normEnum(patch.difficulty);
    if (patch.bloomLevel) patch.bloomLevel = normEnum(patch.bloomLevel);

    if (patch.questionType && !QTYPE.has(patch.questionType)) return res.error('Invalid questionType.', 400);
    if (patch.difficulty && !DIFFICULTY.has(patch.difficulty)) return res.error('Invalid difficulty.', 400);
    if (patch.bloomLevel && !BLOOM.has(patch.bloomLevel)) return res.error('Invalid bloomLevel.', 400);

    const updated = await prisma.question.update({
      where: { id },
      data: patch,
    });

    logger.info(`[QUESTION_BANK] Question updated by ${req.user.email}`, { id });
    return res.success(updated, 'Question updated.');
  } catch (err) {
    return res.error(err.message, 400);
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
    logger.info(`[QUESTION_BANK] Question deactivated by ${req.user.email}`, { id });
    return res.success(updated, 'Question deactivated.');
  } catch (err) {
    return res.error(err.message, 400);
  }
};

export const importQuestionsCsv = async (req, res) => {
  try {
    if (!req.file) return res.error('CSV file is required.', 400);

    const records = csvParse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of records) {
      try {
        const subjectCode = String(row.subjectCode || row.subject_code || row.SubjectCode || row.SubjectCode || '').trim();
        const subject = await prisma.subject.findUnique({ where: { subjectCode } });
        if (!subject) {
          results.skipped++;
          results.errors.push({ row: subjectCode || '?', reason: 'Unknown subjectCode' });
          continue;
        }

        const unit = String(row.unit || row.Unit || '').trim();
        const topic = String(row.topic || row.Topic || '').trim();
        const questionText = String(row.question_text || row.questionText || row.Question || '').trim();

        const qType = normEnum(row.question_type || row.questionType || row.Type);
        const diff = normEnum(row.difficulty || row.Difficulty);
        const bloom = normEnum(row.bloom_level || row.bloomLevel || row.Bloom);

        const marks = Number(row.marks || row.Marks);
        const optionsJson = row.options_json || row.optionsJson || row.OptionsJson || row.options || null;
        const answerKey = row.answer_key || row.answerKey || row.AnswerKey || null;

        if (!unit || !topic || !questionText || !Number.isFinite(marks)) {
          results.skipped++;
          results.errors.push({ row: subjectCode || '?', reason: 'Missing required fields (unit/topic/question_text/marks).' });
          continue;
        }
        if (!QTYPE.has(qType) || !DIFFICULTY.has(diff) || !BLOOM.has(bloom)) {
          results.skipped++;
          results.errors.push({ row: subjectCode || '?', reason: 'Invalid enums (question_type/difficulty/bloom_level).' });
          continue;
        }

        await prisma.question.create({
          data: {
            subjectId: subject.id,
            unit,
            topic,
            questionText,
            questionType: qType,
            difficulty: diff,
            bloomLevel: bloom,
            marks,
            optionsJson: optionsJson ? String(optionsJson) : null,
            answerKey: answerKey ? String(answerKey) : null,
          }
        });

        results.inserted++;
      } catch (e) {
        results.skipped++;
        results.errors.push({ row: row.question_text || row.questionText || '?', reason: 'Invalid row or duplicate constraints.' });
      }
    }

    logger.info(`[QUESTION_BANK] Bulk import by ${req.user.email}`, { inserted: results.inserted, skipped: results.skipped });
    return res.success(results, `Import complete: ${results.inserted} questions inserted.`);
  } catch (err) {
    return res.error(`CSV parsing error: ${err.message}`, 400);
  }
};

