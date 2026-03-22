import mongoose from 'mongoose';

const academicCalendarSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    type: {
        type: String,
        enum: ['Holiday', 'Exam', 'Working Day', 'Event'],
        required: true
    },
    description: {
        type: String
    },
    academicYear: {
        type: String,
        required: true // e.g., "2023-24"
    },
    semester: {
        type: Number,
        required: true // 1, 2, 3...
    }
});

export default mongoose.model('AcademicCalendar', academicCalendarSchema);
