import mongoose from 'mongoose';

/**
 * PreRegisteredFaculty
 * ─────────────────────────────────────────────────────────────────────────────
 * Official faculty roster maintained exclusively by admins.
 * Faculty self-register with their Employee ID + chosen password.
 * All professional details auto-populate from this record.
 */
const preRegisteredFacultySchema = new mongoose.Schema(
    {
        // ── Identity ────────────────────────────────────────────────────────
        facultyId: {
            type: String,
            required: [true, 'Faculty ID is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'College email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },

        // ── Professional Details ────────────────────────────────────────────
        department: {
            type: String,
            required: [true, 'Department is required'],
            trim: true,
        },
        designation: {
            // e.g. "Associate Professor", "Assistant Professor", "HOD"
            type: String,
            required: [true, 'Designation is required'],
            trim: true,
        },
        handledSubjects: {
            type: [String],
            default: [],
        },
        handledBatches: {
            type: [String],
            default: [],
        },

        // ── Registration State ──────────────────────────────────────────────
        isRegistered: {
            type: Boolean,
            default: false,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        registeredAt: {
            type: Date,
            default: null,
        },

        // ── Admin Control ───────────────────────────────────────────────────
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        disabledReason: {
            type: String,
            default: null,
        },
        seededBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

preRegisteredFacultySchema.index({ fullName: 'text', facultyId: 'text', department: 'text' });

export default mongoose.model('PreRegisteredFaculty', preRegisteredFacultySchema);
