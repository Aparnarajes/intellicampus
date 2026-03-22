import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajesha2526@gmail.com';
  const usn = '1AB21CS252';

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email },
    update: { isRegistered: true, isFirstLogin: true, password: '' },
    create: {
      email,
      role: Role.STUDENT,
      password: '',
      isRegistered: true,
      isFirstLogin: true,
    }
  });

  // 2. Create Student Profile
  await prisma.student.upsert({
    where: { usn },
    update: { email, semester: 6, branch: 'Artificial Intelligence & Machine Learning', fullName: 'Aparna Rajesha' },
    create: {
      usn,
      registrationNumber: usn,
      fullName: 'Aparna Rajesha',
      email,
      branch: 'Artificial Intelligence & Machine Learning',
      semester: 6,
      section: 'A',
      gender: 'Female',
      dateOfBirth: new Date('2003-05-15'),
      phone: '+91 9876543210',
      address: '123, Academic Block, IntelliCampus',
      bloodGroup: 'B+',
      userId: user.id
    }
  });

  console.log(`✅ Registered Student: Aparna Rajesha (${email}) as a first-time user.`);
  
  // 3. Get some other IDs to show the user
  const students = await prisma.student.findMany({ take: 3, select: { email: true, usn: true } });
  const faculty = await prisma.faculty.findMany({ take: 2, select: { email: true, facultyId: true } });
  
  console.log('\n--- Registered IDs for Testing ---');
  students.forEach(s => console.log(`[STUDENT] Email: ${s.email} | USN: ${s.usn}`));
  faculty.forEach(f => console.log(`[FACULTY] Email: ${f.email} | ID: ${f.facultyId}`));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
