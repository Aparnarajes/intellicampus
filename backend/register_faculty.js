import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  const facultyId = 'FAC2026001';

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { isRegistered: true, isFirstLogin: true, password: '' },
    create: {
      email,
      role: Role.FACULTY,
      password: '',
      isRegistered: true,
      isFirstLogin: true,
    }
  });

  // 2. Create Faculty Profile
  await prisma.faculty.upsert({
    where: { facultyId },
    update: { email, fullName: 'Prof. Aparna Rajesh', department: 'Computer Science & Engineering' },
    create: {
      facultyId,
      fullName: 'Prof. Aparna Rajesh',
      email,
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      experienceYears: 5,
      userId: user.id
    }
  });

  console.log(`✅ Registered Faculty: Prof. Aparna Rajesh (${email}) as a first-time user.`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
