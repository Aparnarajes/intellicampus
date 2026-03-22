import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔗 Assigning Semester 6 subjects to ${email}...`);

  const faculty = await prisma.faculty.findUnique({
    where: { email }
  });

  if (!faculty) {
    console.error('❌ Faculty not found!');
    return;
  }

  // Find semester 6 CSE subjects
  const subjects = await prisma.subject.findMany({
    where: {
      semester: 6,
      branch: {
        in: ['Computer Science', 'AIML', 'Artificial Intelligence & Machine Learning']
      }
    }
  });

  console.log(`📚 Found ${subjects.length} subjects for Semester 6.`);

  for (const s of subjects) {
    await prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_section: {
          facultyId: faculty.id,
          subjectId: s.id,
          section: 'A'
        }
      },
      update: {},
      create: {
        facultyId: faculty.id,
        subjectId: s.id,
        section: 'A'
      }
    });
    console.log(`✅ Assigned ${s.subjectName} (${s.subjectCode})`);
  }

  console.log('🚀 Assignment Complete! Faculty dashboard should now show subjects.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
