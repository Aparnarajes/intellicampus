import mongoose from 'mongoose';

const mockTestResultSchema = new mongoose.Schema({
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
    totalQuestions: Number,
    correctAnswers: Number,
    incorrectQuestions: [{
        question: String,
        userAnswer: String,
        correctAnswer: String
    }],
    score: Number, // Percentage
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('MockTestResult', mockTestResultSchema);
