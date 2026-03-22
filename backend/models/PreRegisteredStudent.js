import mongoose from 'mongoose';

/**
 * PreRegisteredStudent
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the OFFICIAL college database of admitted students.
 * Records are seeded ONLY by admins (CSV import or manual admin panel).
 * No public write access.
 *
 * When a student registers on IntelliCampus for the first time:
 *   1. They provide their USN + chosen password.
 *   2. System looks up this collection.
 *   3. If found & not yet registered → auto-populate all academic details.
 *   4. A corresponding User document is created/updated.
 *   5. isRegistered flips to true — cannot register again.
 */
const preRegisteredStudentSchema = new mongoose.Schema(
    {
        // ── Identity ────────────────────────────────────────────────────────
        usn: {
            type: String,
            required: [true, 'USN is required'],
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

        // ── Academic Details ────────────────────────────────────────────────
        branch: {
            type: String,
            required: [true, 'Branch is required'],
            trim: true,
        },
        semester: {
            type: Number,
            required: [true, 'Semester is required'],
            min: 1,
            max: 8,
        },
        section: {
            type: String,
            trim: true,
        },
        batch: {
            // e.g. "2022-2026"
            type: String,
            trim: true,
        },
        admissionYear: {
            type: Number,
        },

        // ── Registration State ──────────────────────────────────────────────
        isRegistered: {
            type: Boolean,
            default: false,
            index: true,
        },
        // Reference to the User document created upon first registration
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
            // Admin can disable a student — blocked from all access even if registered
            type: Boolean,
            default: true,
            index: true,
        },
        disabledReason: {
            type: String,
            default: null,
        },

        // Seeded by which admin
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

// Full-text search (for admin panel search bar)
preRegisteredStudentSchema.index({ fullName: 'text', usn: 'text', branch: 'text' });

export default mongoose.model('PreRegisteredStudent', preRegisteredStudentSchema);
