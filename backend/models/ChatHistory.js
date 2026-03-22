import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'assistant'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            cardType: String,
            cardData: mongoose.Schema.Types.Mixed,
            responseType: String
        }
    ]
}, {
    timestamps: true
});

export default mongoose.model('ChatHistory', chatHistorySchema);
