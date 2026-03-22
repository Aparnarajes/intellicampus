import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import logger from '../utils/logger.js';
import prisma from '../config/prisma.js';

/**
 * Generate JWT Access & Refresh Tokens
 */
const signAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    });
};

const signRefreshToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback', {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
};

/**
 * @desc    Disabled signup (invite-only)
 */
export const register = async (req, res) => {
    return res.status(403).json({
        success: false,
        message: 'Self-registration is disabled. Please contact your administrator if you are not in the system.'
    });
};

/**
 * @desc    Verify email token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            tokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        const setupRequired = !user.password;
        
        user.isVerified = true;
        // Only clear token if we're not doing a setup-password handoff
        if (!setupRequired) {
            user.verificationToken = undefined;
            user.tokenExpiry = undefined;
        }
        await user.save();

        res.status(200).json({
            success: true,
            message: setupRequired 
                ? 'Email verified. Please complete your institutional account setup.' 
                : 'Email verified successfully! You can now log in.',
            setupRequired
        });
    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Initiate first-time account activation 
 *          Bridges SQL pre-registration → MongoDB user creation → verification email
 * @route   POST /api/auth/initiate-setup
 * @access  Public
 */
export const initiateSetup = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // ── Step 1: Check if a MongoDB user already exists ──────────────────
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // User exists in MongoDB already
            if (user.isVerified && user.password) {
                return res.status(400).json({
                    success: false,
                    message: 'This account is already active. Please use the login form.'
                });
            }
            // User exists but hasn't completed setup — regenerate token below
        } else {
            // ── Step 2: Look up in SQL pre-registration database ────────────
            let preReg = await prisma.preRegisteredStudent.findUnique({
                where: { email: normalizedEmail }
            });

            let role = 'student';
            let name, department, semester;

            if (preReg) {
                name = preReg.fullName;
                department = preReg.branch;
                semester = preReg.semester;
            } else {
                // Also check faculty pre-registration
                const preRegFaculty = await prisma.preRegisteredFaculty.findUnique({
                    where: { email: normalizedEmail }
                });

                if (preRegFaculty) {
                    preReg = preRegFaculty;
                    role = 'faculty';
                    name = preRegFaculty.fullName;
                    department = preRegFaculty.department;
                    semester = 1; // Faculty don't have semesters, use default
                }
            }

            if (!preReg) {
                return res.status(404).json({
                    success: false,
                    message: 'This email is not in the institutional database. Contact your department administrator.'
                });
            }

            if (!preReg.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Your institutional access has been revoked. Contact administration.'
                });
            }

            // ── Step 3: Create MongoDB User document (null password) ────────
            user = await User.create({
                name,
                email: normalizedEmail,
                password: null,
                department,
                semester,
                role,
                usn: preReg.usn || undefined,
                employeeId: preReg.facultyId || undefined,
                isVerified: false,
                isActive: true
            });

            logger.info(`[AUTH] MongoDB user created for pre-registered ${role}: ${normalizedEmail}`);
        }

        // ── Step 4: Generate verification token ─────────────────────────────
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.tokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        // ── Step 5: Send activation email ───────────────────────────────────
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #1a365d; text-align: center;">Institutional Account Activation</h2>
                <p>Hello ${user.name},</p>
                <p>Your institutional email has been verified in our records. Click below to activate your IntelliCampus account and set your password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activate Account</a>
                </div>
                <p style="font-size: 14px; color: #666;">This link will expire in 15 minutes.</p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">If you did not request this, please ignore this email.</p>
            </div>
        `;

        await sendEmail({
            email: normalizedEmail,
            subject: 'Activate Your IntelliCampus Account',
            html
        });

        logger.info(`[AUTH] Activation email sent to: ${normalizedEmail}`);

        res.status(200).json({
            success: true,
            message: 'Activation email dispatched. Please check your inbox (and spam folder).'
        });
    } catch (error) {
        logger.error('Initiate setup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Resend verification email (Used for First-Time Setup and Resending)
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Institutional email not found' });
        }

        if (user.isVerified && user.password) {
            return res.status(400).json({ success: false, message: 'Account is already verified and setup' });
        }

        const isInitialSetup = !user.isVerified;

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.tokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
        
        const subject = isInitialSetup ? 'Activate Your IntelliCampus Account' : 'Resend Verification Link';
        const title = isInitialSetup ? 'Institutional Account Activation' : 'Verify Your Email';
        const buttonText = isInitialSetup ? 'Initialize Setup' : 'Verify Email';

        const html = `
             <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #1a365d; text-align: center;">${title}</h2>
                <p>Hello ${user.name},</p>
                <p>${isInitialSetup 
                    ? 'Your institutional email is registered. Click below to begin the first-time setup process.' 
                    : 'A new verification link has been generated. Use it to verify your account.'
                }</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2b6cb0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">${buttonText}</a>
                </div>
                <p style="font-size: 14px; color: #666;">This link will expire in 15 minutes.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject,
            html
        });

        res.status(200).json({ 
            success: true, 
            message: isInitialSetup ? 'Activation email dispatched. Please check your inbox.' : 'Verification email sent' 
        });
    } catch (error) {
        logger.error('Resend verification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user & include password, loginAttempts, lockUntil
        const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'This email is not registered in the IntelliCampus database. Please contact your administrator.' 
            });
        }

        // Check if locked
        if (user.isLocked) {
            const timeLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(423).json({ 
                success: false, 
                message: `Account is temporarily locked due to too many failed attempts. Try again in ${timeLeft} minutes.` 
            });
        }

        // FIRST TIME LOGIN: Check if password is set
        if (!user.password) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account setup required. Please enter your email in the "First Time Setup" field to receive a verification link.',
                setupRequired: true
            });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false, 
                message: 'Please verify your email to log in' 
            });
        }

        // Check if active
        if (!user.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been deactivated. Please contact the administrator.' 
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            await user.incLoginAttempts();
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Reset attempts
        await user.resetLoginAttempts();
        logger.info(`[AUTH_SUCCESS] Login: ${user.email} (${user.role}) from ${req.ip}`);

        // Generate Tokens
        const accessToken = signAccessToken(user._id, user.role);
        const refreshToken = signRefreshToken(user._id, user.role);

        // Store refresh token in DB (hashed ideally, but plain-encrypted for this iteration)
        user.refreshToken = refreshToken;
        user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await user.save();

        // Security: HTTP-only cookies for BOTH tokens for maximum CSRF protection
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        };

        res.cookie('accessToken', accessToken, { 
            ...cookieOptions, 
            maxAge: 1 * 60 * 60 * 1000 // 1 hour
        });
        
        res.cookie('refreshToken', refreshToken, { 
            ...cookieOptions, 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                department: user.department,
                semester: user.semester,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Forgot Password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        const message = `You requested a password reset. Please click the link below to reset your password. The link expires in 10 minutes.\n\n${resetUrl}`;
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <h2 style="color: #1a365d; text-align: center;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>We received a request to reset your password for your IntelliCampus account. Click the button below to choose a new password.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #666;">This link will expire in 10 minutes.</p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request - IntelliCampus',
            message,
            html
        });

        res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            resetToken: token,
            tokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Set new password
        user.password = password;
        user.resetToken = undefined;
        user.tokenExpiry = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Setup password for first-time account activation
 * @route   POST /api/auth/setup-password
 * @access  Public
 */
export const setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Find user by verificationToken (preserved during verify-email for setup accounts)
        const user = await User.findOne({
            verificationToken: token,
            tokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired setup token. Please request a new activation link.'
            });
        }

        // Ensure this is actually a first-time setup (password should be null)
        if (user.password) {
            return res.status(400).json({
                success: false,
                message: 'Account already has a password. Use "Forgot Password" to reset it.'
            });
        }

        // Set the password (pre-save hook will hash it)
        user.password = password;
        user.isVerified = true;
        user.verificationToken = undefined;
        user.tokenExpiry = undefined;
        await user.save();

        logger.info(`[AUTH] Account setup completed for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password set successfully! Your account is now active. You can log in.'
        });
    } catch (error) {
        logger.error('Setup password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update profile
 * @route   PATCH /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const { name, department, semester, bio, phone, address, skills, interests } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fields allowed to update
        if (name) user.name = name;
        if (department) user.department = department;
        if (semester) user.semester = semester;
        if (bio) user.bio = bio;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (skills) user.skills = skills;
        if (interests) user.interests = interests;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Refresh Access Token
 * @route   POST /api/auth/refresh
 * @access  Public (Uses Refresh Token Cookie)
 */
export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token missing' });

        // Verify token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback');
        
        // Find user & verify token matches DB
        const user = await User.findById(decoded.id).select('+refreshToken +refreshTokenExpiry');
        if (!user || user.refreshToken !== refreshToken || user.refreshTokenExpiry < Date.now()) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        // Issue new access token
        const newAccessToken = signAccessToken(user._id, user.role);

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, token: newAccessToken });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token mutation detected - re-auth required' });
    }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
    // Revoke refresh token in DB
    if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { 
            $unset: { refreshToken: 1, refreshTokenExpiry: 1 } 
        });
    }

    res.cookie('accessToken', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });
    res.cookie('refreshToken', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
};
