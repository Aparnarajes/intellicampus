import { PrismaClient, AttendanceStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Comprehensive Academic Data Seeding...');

  // 1. Fetch Core Data
  const students = await prisma.student.findMany();
  const subjects = await prisma.subject.findMany({
    include: { facultySubjects: true }
  });
  const faculties = await prisma.faculty.findMany();

  console.log(`Found ${students.length} students, ${subjects.length} subjects, ${faculties.length} faculties.`);

  if (students.length === 0 || subjects.length === 0) {
    console.error('❌ Error: Students or Subjects missing. Run basic seeds first.');
    return;
  }

  // 2. Clear Existing Evaluations and Attendance to avoid duplicates and ensure consistency
  await prisma.evaluation.deleteMany();
  await prisma.attendance.deleteMany();
  console.log('🗑️  Cleared old evaluations and attendance records.');

  // 3. Generate Evaluation and Attendance
  let evalCount = 0;
  let attendCount = 0;

  const BATCH_SIZE = 50;
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Group subjects by semester for easier lookup
  const subjectsBySem = {};
  subjects.forEach(sub => {
    if (!subjectsBySem[sub.semester]) subjectsBySem[sub.semester] = [];
    subjectsBySem[sub.semester].push(sub);
  });

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const studentBatch = students.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const student of studentBatch) {
        // Find subjects for student's semester
        const semesterSubjects = subjectsBySem[student.semester] || [];

        for (const subject of semesterSubjects) {
          // Find the primary faculty for this subject (if any)
          const facSub = subject.facultySubjects[0];
          const facultyId = facSub ? facSub.facultyId : faculties[Math.floor(Math.random() * faculties.length)].id;

          // --- EVALUATION GENERATION ---
          // Determine student performance level for some variation
          const perfRoll = Math.random(); // 0-1
          const factor = perfRoll > 0.8 ? 0.9 : (perfRoll > 0.3 ? 0.7 : 0.5); // Top, Average, Weak

          const ia1 = Math.round((Math.random() * 10 + 15) * factor + (Math.random() * 5)); // 15-25 base
          const ia2 = Math.round((Math.random() * 10 + 15) * factor + (Math.random() * 5));
          const assignment = Math.round((Math.random() * 5 + 5) * factor + (Math.random() * 2));
          const quiz = Math.round((Math.random() * 5 + 5) * factor + (Math.random() * 2));
          const demo = Math.round((Math.random() * 7 + 8) * factor + (Math.random() * 3));
          const viva = Math.round((Math.random() * 5 + 5) * factor + (Math.random() * 2));
          const project = Math.round((Math.random() * 7 + 8) * factor + (Math.random() * 3));
          const review = Math.round((Math.random() * 5 + 5) * factor + (Math.random() * 2));

          const total = ia1 + ia2 + assignment + quiz + demo + viva + project + review;
          
          let grade = 'F';
          if (total >= 85) grade = 'A';
          else if (total >= 70) grade = 'B';
          else if (total >= 50) grade = 'C';
          else if (total >= 35) grade = 'D';

          const remarks = total > 80 ? 'Excellent performance.' : (total > 50 ? 'Steady progress.' : 'Needs improvement.');

          await tx.evaluation.create({
            data: {
              studentId: student.id,
              subjectId: subject.id,
              facultyId: facultyId,
              semester: student.semester,
              ia1Marks: Math.min(ia1, 25),
              ia2Marks: Math.min(ia2, 25),
              assignmentMarks: Math.min(assignment, 10),
              quizMarks: Math.min(quiz, 10),
              demoMarks: Math.min(demo, 15),
              vivaMarks: Math.min(viva, 10),
              miniProjectMarks: Math.min(project, 15),
              projectReviewMarks: Math.min(review, 10),
              totalMarks: total,
              grade,
              remarks,
              evaluationDate: new Date()
            }
          });
          evalCount++;

          // --- ATTENDANCE GENERATION ---
          // Target 70-95%
          const attendanceTarget = 0.7 + (Math.random() * 0.25); 

          for (let d = 0; d < 60; d++) {
            const date = new Date();
            date.setDate(date.getDate() - d);
            // Skip Sundays
            if (date.getDay() === 0) continue;

            const isPresent = Math.random() < attendanceTarget;
            
            await tx.attendance.create({
              data: {
                studentId: student.id,
                subjectId: subject.id,
                facultyId: facultyId,
                semester: student.semester,
                date: date,
                status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT
              }
            });
            attendCount++;
          }
        }
      }
    }, { timeout: 30000 });

    console.log(`Processed ${Math.min(i + BATCH_SIZE, students.length)}/${students.length} students...`);
  }

  console.log(`\n✅ Seeding Complete!`);
  console.log(`Created ${evalCount} Evaluation records.`);
  console.log(`Created ${attendCount} Attendance records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
