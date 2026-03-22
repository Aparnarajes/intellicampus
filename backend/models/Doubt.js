import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['Basic', 'Standard', 'Advanced'],
        default: 'Standard'
    },
    isWeakTopic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick analytics per subject/student
doubtSchema.index({ student: 1, subject: 1 });

export default mongoose.model('Doubt', doubtSchema);
