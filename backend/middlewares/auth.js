import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * protect — JWT Verification Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Validates JWT from header or cookie
 * 2. Loads MongoDB user (auth credentials)
 * 3. Looks up matching Prisma Student/Faculty record by email
 *    and sets req.user.prismaId = prisma record's id for downstream controllers
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
        token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
        logger.warn(`[AUTH_DENIED] Unauthenticated probe from ${req.ip} URL: ${req.url}`);
        return _deny(res, 'Institutional access required. Please authenticate via portal.', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from Mongoose (auth layer)
        const user = await User.findById(decoded.id);

        if (!user) {
            return _deny(res, 'User account no longer exists.', 401);
        }

        if (!user.isActive) {
            return _deny(res, 'Account is inactive. Please contact admin.', 403);
        }

        // ── Bridge: resolve Prisma record ID by email ────────────────────────
        // All Prisma controllers use `userId` which refers to the Prisma User table.
        // We resolve the Prisma User first, then the Student/Faculty profile.
        try {
            const role = (user.role || '').toLowerCase();

            // Find the Prisma User record that matches this email
            const prismaUser = await prisma.user.findUnique({
                where: { email: user.email },
                include: {
                    student: true,
                    faculty: true
                }
            });

            // ── Hydrate plain req.user to bypass Mongoose schema enforcement ──
            req.user = user.toObject({ virtuals: true });
            delete req.user.password; // Defense-in-depth

            if (prismaUser) {
                req.user.prismaUserId = prismaUser.id;
                if (role === 'student' && prismaUser.student) {
                    req.user.prismaId = prismaUser.student.id;
                } else if (role === 'faculty' && prismaUser.faculty) {
                    req.user.prismaId = prismaUser.faculty.id;
                } else if (role === 'admin') {
                    req.user.prismaId = prismaUser.id;
                }
            } else {
                req.user.prismaUserId = null;
                req.user.prismaId = null;
            }
        } catch (prismaErr) {
            logger.warn(`[AUTH] Prisma bridge lookup failed for ${user.email}: ${prismaErr.message}`);
            req.user = user.toObject({ virtuals: true });
            req.user.prismaUserId = null;
            req.user.prismaId = null;
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return _deny(res, 'Session expired. Please log in again.', 401);
        }
        return _deny(res, 'Not authorized.', 401);
    }
};

/**
 * authorize — Role Guard Middleware
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return _deny(res, 'Not authenticated.', 401);

        // Convert Prisma roles (uppercase) to handle input flexibly if needed
        const normalizedUserRole = req.user.role.toLowerCase();
        const normalizedAllowedRoles = roles.map(r => r.toLowerCase());

        if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
            logger.warn(`[AUTH] Role denied: ${req.user.email} (${req.user.role}) attempted ${req.originalUrl}`);
            return _deny(res, `Access denied. Requires one of: [${roles.join(' / ')}].`, 403);
        }

        next();
    };
};

const _deny = (res, message, statusCode) => {
    if (res.error) return res.error(message, statusCode);
    return res.status(statusCode).json({ success: false, message });
};
