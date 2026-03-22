import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Testing DB connection...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Successfully connected. User count:', await prisma.user.count());
        
        const adminEmail = 'aparnaintellicampus@gmail.com';
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail.toLowerCase() }
        });
        
        console.log('Admin account found:', !!admin);
        if (admin) {
            console.log('Admin details:', JSON.stringify(admin, null, 2));
        }
    } catch (err) {
        console.error('DB CONNECTION FAILED:', err.message);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

check();
