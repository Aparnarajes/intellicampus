import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    strongSubjects: [String],
    weakSubjects: [String],
    attendanceRiskSubjects: [String],
    preferredLearningStyle: {
        type: String,
        enum: ['Visual', 'Theoretical', 'Practical', 'Concise'],
        default: 'Theoretical'
    },
    topWeakTopics: [String],
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    metadata: {
        avgAttendance: Number,
        avgMarks: Number,
        totalDoubtsSolved: Number
    },
    dailyStudyHours: {
        type: Number,
        default: 2
    }
});

export default mongoose.model('StudentProfile', studentProfileSchema);
