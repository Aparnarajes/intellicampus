import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    batch: {
        type: String,
        required: true
    },
    testType: {
        type: String,
        enum: ['IA-1', 'IA-2', 'IA-3', 'Final'],
        required: true
    },
    marks: {
        type: Number,
        required: true,
        min: 0
    },
    maxMarks: {
        type: Number,
        required: true,
        default: 50
    },
    grade: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optimized indexes for analytics
marksSchema.index({ student: 1, subject: 1, createdAt: -1 });
marksSchema.index({ subject: 1, marks: 1 });
marksSchema.index({ batch: 1, subject: 1 });


// Calculate grade before saving
marksSchema.pre('save', function (next) {
    if (this.marks !== undefined && this.maxMarks !== undefined) {
        const percentage = (this.marks / this.maxMarks) * 100;
        if (percentage >= 90) this.grade = 'S';
        else if (percentage >= 80) this.grade = 'A';
        else if (percentage >= 70) this.grade = 'B';
        else if (percentage >= 60) this.grade = 'C';
        else if (percentage >= 50) this.grade = 'D';
        else if (percentage >= 40) this.grade = 'E';
        else this.grade = 'F';
    }
    next();
});

export default mongoose.model('Marks', marksSchema);
