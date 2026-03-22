import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔍 Inspecting Prisma records for email: ${email}...`);

  const student = await prisma.student.findUnique({
    where: { email },
    include: { profile: true, user: true }
  });

  if (student) {
    console.log('✅ STUDENT RECORD FOUND');
    console.log(`- ID: ${student.id}`);
    console.log(`- Role: ${student.user.role}`);
    console.log(`- Semester: ${student.semester}`);
    console.log(`- Profile Exists: ${!!student.profile}`);
  } else {
    console.log('❌ NO STUDENT RECORD FOUND');
  }

  const faculty = await prisma.faculty.findUnique({
    where: { email },
    include: { user: true }
  });

  if (faculty) {
    console.log('✅ FACULTY RECORD FOUND');
    console.log(`- ID: ${faculty.id}`);
    console.log(`- Role: ${faculty.user.role}`);
  } else {
    console.log('❌ NO FACULTY RECORD FOUND');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log('✅ PRISMA USER RECORD FOUND');
    console.log(`- ID: ${user.id}`);
    console.log(`- Role: ${user.role}`);
  } else {
    console.log('❌ NO PRISMA USER RECORD FOUND');
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
