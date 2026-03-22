import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    embedding: {
        type: [Number],
        required: true,
        select: true,   // Included by default; retrieval layer uses .lean() + manual cosine
    },
    subject: {
        type: String,
        required: true,
        index: true,
    },
    // Unit/Module this chunk belongs to (e.g. "Unit 3") — auto-detected during ingestion
    unit: {
        type: String,
        index: true,
    },
    topic: {
        type: String,
        index: true,
    },
    sourceType: {
        type: String,
        enum: ['syllabus', 'notes', 'questionPaper'],
        required: true,
        index: true,
    },
    fileName: {
        type: String,
        index: true,
    },
    metadata: {
        pageNumber: Number,
        chunkIndex: Number,
        charCount: Number,
        unit: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Compound index for the most common retrieval query pattern
documentChunkSchema.index({ subject: 1, sourceType: 1 });
documentChunkSchema.index({ fileName: 1, subject: 1 });

export default mongoose.model('DocumentChunk', documentChunkSchema);
