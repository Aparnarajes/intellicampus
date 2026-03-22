import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const gradeFromPct = (pct) => {
    if (pct >= 90) return 'S';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
};

const fixEvaluations = async () => {
    console.log("Fetching students...");
    const students = await prisma.student.findMany({ include: { evaluations: true } });
    const subjects = await prisma.subject.findMany();
    const faculty = await prisma.faculty.findMany({ include: { facultySubjects: true } });

    console.log(`Found ${students.length} students, ${subjects.length} subjects, ${faculty.length} faculty`);

    const genIA = (tier) => tier === 'high' ? rInt(18, 25) : tier === 'mid' ? rInt(12, 20) : rInt(7, 16);
    const genAsgn = (tier) => tier === 'high' ? rInt(8, 10) : tier === 'mid' ? rInt(6, 9) : rInt(4, 7);
    const genQuiz = (tier) => tier === 'high' ? rInt(7, 10) : tier === 'mid' ? rInt(5, 9) : rInt(3, 7);

    let count = 0;
    for (const student of students) {
        const tier = student.overallGpa >= 8.5 ? 'high' : student.overallGpa >= 7.0 ? 'mid' : 'low';
        // Semester subjects
        const stSubjects = subjects.filter(s => s.semester === student.semester);
        
        for (const sub of stSubjects) {
            // Find faculty
            const fs = await prisma.facultySubject.findFirst({ where: { subjectId: sub.id } });
            const facultyId = fs ? fs.facultyId : faculty[0]?.id;
            
            if (!facultyId) continue;

            const ia1 = genIA(tier);
            const ia2 = genIA(tier);
            const asgn = genAsgn(tier);
            const quiz = genQuiz(tier);
            const totalMarks = ia1 + ia2 + asgn + quiz;
            const pct = (totalMarks / 70) * 100;

            await prisma.evaluation.upsert({
                where: { studentId_subjectId: { studentId: student.id, subjectId: sub.id } },
                update: {},
                create: {
                    studentId: student.id,
                    subjectId: sub.id,
                    facultyId: facultyId,
                    semester: student.semester,
                    ia1Marks: ia1,
                    ia2Marks: ia2,
                    assignmentMarks: asgn,
                    quizMarks: quiz,
                    totalMarks: totalMarks,
                    grade: gradeFromPct(pct),
                    remarks: "Seeded"
                }
            });
            count++;
        }
    }
    console.log(`Successfully created ${count} evaluation records.`);
    return count;
};

fixEvaluations().catch(console.error).finally(async () => {
    console.log("Updating student performance profiles...");
    const { updateStudentPerformanceProfile } = await import('./services/analytics.service.js');
    const students = await prisma.student.findMany();
    for (const st of students) {
        try {
            await updateStudentPerformanceProfile(st.id);
        } catch (e) {
            console.error("error updating profile for " + st.id, e.message);
        }
    }
    console.log("Done.");
    await prisma.$disconnect()
});
