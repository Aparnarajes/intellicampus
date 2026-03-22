import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Users:', await prisma.user.count());
        console.log('Students:', await prisma.student.count());
        console.log('Faculty:', await prisma.faculty.count());
        console.log('PreStuds:', await prisma.preRegisteredStudent.count());
        console.log('PreFac:', await prisma.preRegisteredFaculty.count());
    } finally {
        await prisma.$disconnect();
    }
}
check();
