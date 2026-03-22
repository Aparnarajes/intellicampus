import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to add a Correlation ID to each request
 */
export const requestLogger = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | CID: ${correlationId}`);
    next();
};

/**
 * Standardized Response Formatter
 */
export const responseFormatter = (req, res, next) => {
    const SENSITIVE_FIELDS = ['password', 'refreshToken', 'verificationToken', 'resetToken', '__v', 'passwordResetToken', 'passwordResetExpires'];

    const stripSensitive = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(stripSensitive);

        const newObj = { ...obj };
        if (newObj.toObject) {
            // Mongoose compatibility: toObject() returns POJO but we still want to strip
            const pojo = newObj.toObject({ virtuals: true });
            return stripSensitive(pojo);
        }

        for (const field of SENSITIVE_FIELDS) {
            delete newObj[field];
        }

        // Recursive strip
        for (const key in newObj) {
            if (typeof newObj[key] === 'object') {
                newObj[key] = stripSensitive(newObj[key]);
            }
        }
        return newObj;
    };

    res.success = (data, message = 'Success', statusCode = 200) => {
        const sanitized = stripSensitive(data);
        return res.status(statusCode).json({
            success: true,
            message,
            data: sanitized,
            correlationId: req.correlationId
        });
    };

    res.error = (message = 'Error', statusCode = 500, error = null) => {
        return res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? (error?.message || error) : undefined,
            correlationId: req.correlationId
        });
    };

    next();
};
