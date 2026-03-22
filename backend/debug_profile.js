import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    const user = await prisma.user.findUnique({
        where: { email: 'aparnarajesha2526@gmail.com' },
        include: { student: true, faculty: true }
    });

    console.log('USER OBJECT:', JSON.stringify(user, null, 2));

    const roleData = user.role === 'STUDENT' ? user.student : user.faculty;
    console.log('ROLE DATA:', roleData);

    const profile = {
        id: user.id,
        role: user.role.toLowerCase(),
        email: user.email,
        name: roleData?.fullName || 'Anonymous User',
        usn: roleData?.usn,
        batch: roleData?.section,
        semester: roleData?.semester,
        branch: roleData?.branch
    };

    console.log('FINAL PROFILE:', profile);
    process.exit();
}

debug();
