import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    faculty: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true
    },
    batch: {
        type: String,
        required: true
    }
});

// Optimized indexes for analytics
attendanceSchema.index({ student: 1, subject: 1, date: -1 });
attendanceSchema.index({ subject: 1, status: 1, date: -1 });
attendanceSchema.index({ batch: 1, subject: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
