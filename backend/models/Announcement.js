import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    targetBatch: {
        type: String, // 'All' or specific batch like '2023-A'
        default: 'All'
    },
    category: {
        type: String,
        enum: ['Academic', 'Event', 'Urgent', 'Holiday'],
        default: 'Academic'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Announcement', announcementSchema);
