import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    subjectCode: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Internal', 'Semester', 'Practical'],
        default: 'Internal'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Exam', examSchema);
