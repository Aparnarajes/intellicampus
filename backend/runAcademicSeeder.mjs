/**
 * ════════════════════════════════════════════════════════════════════════════
 *  STANDALONE RUNNER — IntelliCampus Academic Data Seeder
 *  Usage: node runAcademicSeeder.mjs
 *  (Run from inside the backend/ directory)
 * ════════════════════════════════════════════════════════════════════════════
 */
import dotenv from 'dotenv';
dotenv.config();

import seedAcademicData from './utils/academicDataSeeder.js';
import prisma from './config/prisma.js';
import logger from './utils/logger.js';

(async () => {
    logger.info('🚀 Standalone Academic Data Seeder — Starting...');
    try {
        await seedAcademicData();
        logger.info('✅ Seeding complete. Disconnecting from Prisma...');
    } catch (err) {
        logger.error('❌ Seeding failed:', err.message);
        logger.error(err.stack);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
        logger.info('🔌 Prisma disconnected. Bye!');
    }
})();
