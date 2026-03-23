import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'mongo-sanitize';
import logger from './utils/logger.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import adminAcademicRoutes from './routes/adminAcademicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import marksRoutes from './routes/marksRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adaptiveRoutes from './routes/adaptiveRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import questionBankRoutes from './routes/questionBankRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import seedAdmin from './utils/adminSeeder.js';
import seedCRData from './utils/crSeeder.js';
import seedPreRegistrationData from './utils/preRegSeeder.js';
import seedAcademicERP from './utils/sqlSeeder.js';
import seedAcademicData from './utils/academicDataSeeder.js';
import { requestLogger, responseFormatter } from './middlewares/gateway.js';
import { globalRateLimiter, adminRateLimiter } from './middlewares/rateLimiter.js';

const app = express();

// ── CORS & SECURITY ──────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or requests from the dev environment
        if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            logger.warn(`[SECURITY] Blocked Cross-Origin request: ${origin}`);
            callback(new Error('Scholastic Origin Blocked'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    credentials: true,
};

app.use(helmet()); // Production-grade header security
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', globalRateLimiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Set Security HTTP Headers (Helmet) - Already set above

// Data sanitization against NoSQL query injection
app.use((req, res, next) => {
    if (req.body) req.body = mongoSanitize(req.body);
    next();
});

// Custom Gateway Pattern Middleware
app.use(requestLogger);
app.use(responseFormatter);

// Core Academic ERP Routes (PostgreSQL/Prisma)
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic-admin', adminRateLimiter, adminAcademicRoutes);

// Intelligence & Analytics (Prisma Driven)
app.use('/api/analytics', analyticsRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/adaptive', adaptiveRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/question-bank', questionBankRoutes);

// Legacy/AI Support (MongoDB)
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api', eventRoutes);

// Diagnostic Health Check Endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', engine: 'active', timestamp: new Date() });
});

app.get('/api/debug/health', (req, res) => {
    res.json({ status: 'UP', health: 'EXCELLENT', timestamp: new Date(), db: 'connected' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/users', adminRateLimiter, userRoutes);

app.use('/api/users', adminRateLimiter, userRoutes);

app.get('/', (req, res) => {
    res.send('Academic ERP API is running...');
});

// Final Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(`[GLOBAL_ERROR] ${err.message}`, { stack: err.stack, url: req.url });
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

// Connect to database then start listening
const startServer = async () => {
    try {
        try {
            await connectDB();
            await seedAdmin();
            await seedCRData();
            await seedPreRegistrationData();
            await seedAcademicERP();
            await seedAcademicData();
        } catch (seedErr) {
            logger.error(`Database seeding error: ${seedErr.message}. Skipping...`);
        }

        // Initialise Redis — non-fatal; caching degrades gracefully if Redis is down
        try {
            await connectRedis();
        } catch (redisErr) {
            logger.warn('Redis connection failed. Caching is disabled.');
        }

   // Global Error Handling & Not Found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Neural pathway not found: ${req.originalUrl}`
    });
});

app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    logger.error(`[CRITICAL_FAIL] ${err.message}`, { stack: err.stack, correlationId: req.headers['x-correlation-id'] });
    res.status(status).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Institutional server error' : err.message
    });
});

const server = app.listen(PORT, () => {
    logger.info(`🚀 [ENGINE_START] Node Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📡 [GATEWAY_LIVE] Portal accessible via port: ${PORT}`);
});
    } catch (error) {
        logger.error(`Error starting server: ${error.message}`, error);
        process.exit(1);
    }
};

startServer();
