import mongoose from 'mongoose';

const studyTaskSchema = new mongoose.Schema({
    subject: String,
    topic: String,
    duration: String, // e.g. "1 hour"
    taskType: {
        type: String,
        enum: ['learn', 'practice', 'revise']
    }
});

const dailyPlanSchema = new mongoose.Schema({
    day: Number, // 1 to 7
    date: Date,
    tasks: [studyTaskSchema]
});

const studyPlanSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    plan: [dailyPlanSchema],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: Date,
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('StudyPlan', studyPlanSchema);
