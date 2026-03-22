import express from 'express';
import { 
    register, 
    login, 
    verifyEmail, 
    forgotPassword, 
    resetPassword, 
    setupPassword,
    initiateSetup,
    getProfile, 
    updateProfile,
    resendVerification,
    logout,
    refresh
} from '../controllers/authController.js';
import { validate } from '../middlewares/validator.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import { protect } from '../middlewares/auth.js';
import Joi from 'joi';

const router = express.Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')).required()
        .messages({
            'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character.'
        }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
        .messages({
            'any.only': 'Passwords do not match'
        }),
    department: Joi.string().required(),
    semester: Joi.string().required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    password: Joi.string().required(),
});

const verifyEmailSchema = Joi.object({
    token: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')).required()
        .messages({
            'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character.'
        }),
});

const setupPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')).required()
        .messages({
            'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 number, and 1 special character.'
        }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

const initiateSetupSchema = Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

// Rate-limit all auth routes
router.use(authRateLimiter);

// Auth Flow
router.post('/login', validate(loginSchema), login);
router.post('/initiate-setup', validate(initiateSetupSchema), initiateSetup);
router.post('/setup-password', validate(setupPasswordSchema), setupPassword);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(initiateSetupSchema), resendVerification);

// Recovery
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Information
router.get('/profile', protect, getProfile);
router.get('/student-profile', protect, getProfile); // Alias for student-profile
router.patch('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);

export default router;
