import prisma from './config/prisma.js';

async function check() {
    const students = await prisma.preRegisteredStudent.findMany();
    console.log('Pre-registered Students:', JSON.stringify(students, null, 2));

    const registered = await prisma.student.findMany();
    console.log('Registered Students:', JSON.stringify(registered, null, 2));

    const users = await prisma.user.findMany();
    console.log('Users:', JSON.stringify(users, null, 2));
}

check().catch(console.error);
