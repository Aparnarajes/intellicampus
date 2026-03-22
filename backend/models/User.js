import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User — Runtime account document
 * ─────────────────────────────────────────────────────────────────────────────
 * Created ONLY via the gated registration flow (USN / Faculty ID lookup).
 * All academic/personal data is populated from PreRegisteredStudent /
 * PreRegisteredFaculty — not accepted from client input.
 *
 * Security features:
 *   - loginAttempts + lockUntil  → account lock after 5 bad passwords
 *   - isActive (admin toggle)    → instant account suspension
 *   - password.select:false      → never leaks in queries
 * ─────────────────────────────────────────────────────────────────────────────
 */

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
        default: null // Null for pre-registered students
    },
    department: {
        type: String,
        required: [true, 'Please add a department']
    },
    semester: {
        type: Number, // Changed to Number as per 1-8 requirement
        required: [true, 'Please add a semester'],
        min: 1,
        max: 8
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        default: 'student'
    },
    // Verification & Refresh Tokens
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    refreshToken: {
        type: String,
        select: false // Never send to client unless explicitly needed for rotation
    },
    refreshTokenExpiry: {
        type: Date,
        select: false
    },
    resetToken: String,
    tokenExpiry: Date,

    // Specific fields for students (Pre-registered)
    usn: {
        type: String, 
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    parentName: {
        type: String,
        trim: true
    },
    parentPhone: {
        type: String,
        trim: true
    },
    parentEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        type: String
    },
    employeeId: {
        type: String, // For faculty
        unique: true,
        sparse: true
    },
    batch: {
        type: String, // For students
        sparse: true
    },
    // For faculty: subjects and batches they manage
    handledSubjects: {
        type: [String],
        default: []
    },
    handledBatches: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    skills: {
        type: [String],
        default: []
    },
    academicPerformance: {
        cgpa: { type: Number, default: 0 },
        attendance: { type: Number, default: 0 },
        testScores: { type: Number, default: 0 },
        overallScore: { type: Number, default: 0 } 
    },
    interests: {
        type: String, 
    },
    profileImage: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date,
    },

    // ── Security: Account Lock ───────────────────────────────────────────────
    loginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    lockUntil: {
        type: Date,
        select: false,
    },

    // ── Admin Control ────────────────────────────────────────────────────────
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    disabledReason: {
        type: String,
        default: null,
    },

    // ── Traceability ─────────────────────────────────────────────────────────
    // Points back to PreRegisteredStudent / PreRegisteredFaculty record
    preRegistrationId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: hash password if modified ───────────────────────────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(12); // 12 rounds for stronger hashing
    this.password = await bcrypt.hash(this.password, salt);
});

// ── Methods ───────────────────────────────────────────────────────────────────

/** Compare plaintext password against stored hash */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Increment failed login counter.
 * Locks account for LOCK_DURATION_MS after MAX_ATTEMPTS failures.
 * Returns true if the account is now locked.
 */
userSchema.methods.incLoginAttempts = async function () {
    // If a previous lock has expired, reset the counter
    if (this.lockUntil && this.lockUntil < Date.now()) {
        await this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: '' } });
        return false;
    }

    const updates = { $inc: { loginAttempts: 1 } };
    const newAttempts = (this.loginAttempts || 0) + 1;

    if (newAttempts >= MAX_ATTEMPTS) {
        updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
    }

    await this.updateOne(updates);
    return newAttempts >= MAX_ATTEMPTS;
};

/** Reset counter on successful login */
userSchema.methods.resetLoginAttempts = async function () {
    await this.updateOne({
        $set: { loginAttempts: 0, lastLogin: new Date() },
        $unset: { lockUntil: '' },
    });
};

export { MAX_ATTEMPTS, LOCK_DURATION_MS };
export default mongoose.model('User', userSchema);
