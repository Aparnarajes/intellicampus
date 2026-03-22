import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Re-registering critical test users after DB wipe...');

  const users = [
    {
      email: 'aparnarajesha2526@gmail.com',
      role: Role.STUDENT,
      fullName: 'Aparna Rajesha',
      usn: '1AB21CS252',
      semester: 6
    },
    {
      email: 'aparnarajeshapzz@gmail.com',
      role: Role.FACULTY,
      fullName: 'Prof. Aparna Rajesh',
      facultyId: 'FAC2026001',
      department: 'Computer Science & Engineering'
    }
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { isRegistered: true, isFirstLogin: true, password: '' },
      create: {
        email: u.email,
        role: u.role,
        password: '',
        isRegistered: true,
        isFirstLogin: true,
      }
    });

    if (u.role === Role.STUDENT) {
      await prisma.student.upsert({
        where: { usn: u.usn },
        update: { email: u.email, fullName: u.fullName, semester: u.semester, userId: user.id },
        create: {
          usn: u.usn,
          fullName: u.fullName,
          email: u.email,
          branch: 'Artificial Intelligence & Machine Learning',
          semester: u.semester,
          section: 'A',
          userId: user.id
        }
      });
    } else {
      await prisma.faculty.upsert({
        where: { facultyId: u.facultyId },
        update: { email: u.email, fullName: u.fullName, userId: user.id },
        create: {
          facultyId: u.facultyId,
          fullName: u.fullName,
          email: u.email,
          department: u.department,
          designation: 'Assistant Professor',
          userId: user.id
        }
      });
    }
    console.log(`✅ Registered ${u.role}: ${u.fullName} (${u.email})`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
