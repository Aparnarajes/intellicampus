import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import logger from './logger.js';

const seedAdmin = async () => {
    try {
        const adminEmail = 'aparnaintellicampus@gmail.com';
        const adminPassword = 'intellicampus8187';

        const adminAccount = await prisma.user.findUnique({
            where: { email: adminEmail.toLowerCase() }
        });

        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        if (!adminAccount) {
            await prisma.user.create({
                data: {
                    email: adminEmail.toLowerCase(),
                    password: hashedPassword,
                    role: 'ADMIN',
                    isRegistered: true,
                    isFirstLogin: false,
                    isVerified: true
                }
            });
            logger.info('✅ Admin account created in SQL: aparnaintellicampus');
        } else {
            await prisma.user.update({
                where: { id: adminAccount.id },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    isFirstLogin: false,
                    isVerified: true
                }
            });
            logger.info('ℹ️ Admin account synced in SQL.');
        }
    } catch (error) {
        logger.error('❌ Error seeding admin in SQL:', error.message);
    }
};

export default seedAdmin;
