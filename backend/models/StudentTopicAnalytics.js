import mongoose from 'mongoose';

const studentTopicAnalyticsSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        default: 100, // 0 to 100
        min: 0,
        max: 100
    },
    isWeak: {
        type: Boolean,
        default: false
    },
    metadata: {
        doubtCount: { type: Number, default: 0 },
        incorrectMockAnswers: { type: Number, default: 0 },
        lowMarksCount: { type: Number, default: 0 }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index for unique student-subject-topic analytics
studentTopicAnalyticsSchema.index({ student: 1, subject: 1, topic: 1 }, { unique: true });

export default mongoose.model('StudentTopicAnalytics', studentTopicAnalyticsSchema);
