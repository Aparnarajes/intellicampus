import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Investigating duplicate students by name and semester...');
  
  // Find all students
  const students = await prisma.student.findMany({
    orderBy: { fullName: 'asc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const s of students) {
    const key = `${s.fullName.toLowerCase()}|${s.semester}|${s.section || 'N/A'}`;
    if (seen.has(key)) {
      toDelete.push(s);
    } else {
      seen.add(key);
    }
  }

  console.log(`Found ${toDelete.length} duplicate entries based on Name + Semester.`);

  for (const s of toDelete) {
    try {
      // Delete the student (which should delete evaluations/attendance via cascade if set, otherwise we do it manually)
      // First, get the associated user
      const studentWithUser = await prisma.student.findUnique({
        where: { id: s.id },
        select: { userId: true }
      });

      // Delete evaluations and attendance for this student
      await prisma.evaluation.deleteMany({ where: { studentId: s.id } });
      await prisma.attendance.deleteMany({ where: { studentId: s.id } });
      await prisma.assignmentSubmission.deleteMany({ where: { studentId: s.id } });

      // Delete student record
      await prisma.student.delete({ where: { id: s.id } });

      // Delete user record if it exists
      if (studentWithUser?.userId) {
        await prisma.user.delete({ where: { id: studentWithUser.userId } });
      }

      console.log(`🗑️ Deleted: ${s.fullName} (USN: ${s.usn}, Sem: ${s.semester})`);
    } catch (err) {
      console.error(`❌ Failed to delete ${s.usn}: ${err.message}`);
    }
  }

  console.log('✨ Cleanup complete.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
