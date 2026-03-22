import Joi from 'joi';

/**
 * Validation Middleware
 * Returns an error using the Gateway pattern if validation fails.
 */
export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message).join(', ');
        return res.error ? res.error(errorMessages, 400) : res.status(400).json({ success: false, error: errorMessages });
    }

    next();
};

// ─────────────────────────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────────────────────────

export const registerSchema = Joi.object({
    name: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('student', 'faculty', 'admin').default('student'),
    usn: Joi.string().when('role', { is: 'student', then: Joi.required(), otherwise: Joi.optional() }),
    employeeId: Joi.string().when('role', { is: 'faculty', then: Joi.required(), otherwise: Joi.optional() }),
    batch: Joi.string().optional(),
    parentEmail: Joi.string().email().optional()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// ─────────────────────────────────────────────────────────────────
// AI/CR Schemas
// ─────────────────────────────────────────────────────────────────

export const doubtSchema = Joi.object({
    question: Joi.string().required().min(5).max(1000),
    history: Joi.array().optional()
});

export const noteGenSchema = Joi.object({
    subjectCode: Joi.string().required(),
    unit: Joi.string().required(),
    prompt: Joi.string().required(),
    modelName: Joi.string().optional()
});

// ─────────────────────────────────────────────────────────────────
// Attendance Schemas
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Attendance Schemas
// ─────────────────────────────────────────────────────────────────

// Single attendance record — matches attendanceController.markAttendance
export const markAttendanceSchema = Joi.object({
    studentId: Joi.string().required(),
    subjectId: Joi.string().required(),
    status: Joi.string().valid('PRESENT', 'ABSENT', 'Present', 'Absent').required(),
    date: Joi.string().required(),  // ISO date string
});

// Batch attendance — matches attendanceController.markAttendanceBatch
export const markAttendanceBatchSchema = Joi.object({
    subjectId: Joi.string().required(),
    date: Joi.string().required(),
    records: Joi.array().items(
        Joi.object({
            studentId: Joi.string().required(),
            status: Joi.string().valid('PRESENT', 'ABSENT', 'Present', 'Absent').required(),
        })
    ).min(1).required(),
});

// Batch marks save — matches marksController.saveMarks
export const saveMarksSchema = Joi.object({
    subjectCode: Joi.string().required(),
    testType: Joi.string().required(),
    maxMarks: Joi.number().min(1).required(),
    marksData: Joi.array().items(
        Joi.object({
            studentId: Joi.string().required(),
            marks: Joi.number().min(0).required(),
        })
    ).min(1).required(),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    bio: Joi.string().allow('', null).max(500),
    phone: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    interests: Joi.string().allow('', null),
    skills: Joi.array().items(Joi.string()).allow(null),
    birthday: Joi.date().allow('', null),
    profileImage: Joi.string().allow('', null),
    parentEmail: Joi.string().email().allow('', null),
    parentName: Joi.string().allow('', null),
    parentPhone: Joi.string().allow('', null)
});

// ─────────────────────────────────────────────────────────────────
// Adaptive Assessment Engine Schemas
// ─────────────────────────────────────────────────────────────────

export const generatePaperSchema = Joi.object({
    subjectCode: Joi.string().required(),
    totalMarks: Joi.number().min(1).required(),
    examType: Joi.string().valid('Internal', 'Mock', 'Practice', 'INTERNAL', 'MOCK', 'PRACTICE').default('Practice'),
    adaptiveEnabled: Joi.boolean().default(true),
    seed: Joi.string().allow('', null),
    targetStudentUserId: Joi.string().allow('', null),
    includeQuestionText: Joi.boolean().default(true),
    excludeLastNPapers: Joi.number().integer().min(0).max(20).default(3),
    recentAttemptDays: Joi.number().integer().min(0).max(365).default(30),
});

export const recordAttemptsSchema = Joi.object({
    paperId: Joi.string().allow('', null),
    attempts: Joi.array().items(
        Joi.object({
            questionId: Joi.string().required(),
            isCorrect: Joi.boolean().allow(null),
            responseTimeMs: Joi.number().integer().min(0).allow(null),
        })
    ).min(1).required(),
});