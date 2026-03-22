import mongoose from 'mongoose';

/**
 * GeneratedPaper — MongoDB schema
 * ────────────────────────────────
 * Stores every adaptive question paper produced by AdaptiveEngine.
 * Papers are linked to the student who requested them and indexed
 * by subject + unit so they can be quickly looked up for reuse.
 */

const questionSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    question: { type: String, required: true },
    marks: { type: Number, required: true, enum: [2, 5, 10] },
    difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    bloomsLevel: { type: String },
    answerHint: { type: String },
    estimatedTime: { type: Number }, // minutes
}, { _id: false });

const difficultyProfileSchema = new mongoose.Schema({
    easyPct: { type: Number },
    mediumPct: { type: Number },
    hardPct: { type: Number },
    easyCount: { type: Number },
    mediumCount: { type: Number },
    hardCount: { type: Number },
}, { _id: false });

const performanceSnapshotSchema = new mongoose.Schema({
    overallAvgPct: { type: Number },
    attendanceRate: { type: Number },
    last5ScoresPct: { type: [Number] },
    weakSubjects: { type: [String] },
    strongSubjects: { type: [String] },
    lowAttendanceSubjects: { type: [String] },
    adaptationFlags: { type: [String] },  // e.g. ['WEAK_TOPICS', 'LOW_ATTENDANCE']
}, { _id: false });

const generatedPaperSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    subjectCode: { type: String, required: true, index: true },
    subjectTitle: { type: String },
    unit: { type: String, required: true },
    semester: { type: String },

    // The generated questions
    questions: { type: [questionSchema], required: true },

    // Analytical metadata
    maxMarks: { type: Number },
    totalTime: { type: Number },        // estimated minutes
    questionCount: { type: Number },
    difficulty: { type: String },        // label, e.g. 'Adaptive'

    // The computed profile used for adaptation
    performanceSnapshot: { type: performanceSnapshotSchema },
    difficultyProfile: { type: difficultyProfileSchema },

    // Origin — 'adaptive' | 'manual' | 'ai'
    generationMode: { type: String, default: 'adaptive' },

    // Allow reuse detection
    contentHash: { type: String, index: true },

    createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index for fast reuse lookup
generatedPaperSchema.index({ student: 1, subjectCode: 1, unit: 1, createdAt: -1 });

export default mongoose.model('GeneratedPaper', generatedPaperSchema);
