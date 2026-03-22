import mongoose from 'mongoose';

const studentMemorySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Ensure we only retrieve the most recent memories
studentMemorySchema.index({ student: 1, timestamp: -1 });

export default mongoose.model('StudentMemory', studentMemorySchema);
