import prisma from '../backend/config/prisma.js';

async function ingestSyllabusToDashboard() {
    console.log('📖 Processing Uploaded 8th Sem Syllabus...');

    const FULL_BRANCH = "Artificial Intelligence & Machine Learning";
    const FACULTY_ID = "AIML-FAC-001"; // Dr. Priya Venkataraman

    // 1. Create 8th Sem Subjects based on PDF content
    const subjects = [
        { code: '23SAL081', name: 'Internship-3 (ExcelR Edtech)', sem: 8 },
        { code: '23SAL082', name: 'Major Project Phase-2 (Mental Health System)', sem: 8 },
        { code: '23SAL083', name: 'Technical Seminar', sem: 8 }
    ];

    const subjectRecords = [];
    for (const s of subjects) {
        const sub = await prisma.subject.upsert({
            where: { subjectCode: s.code },
            update: { branch: FULL_BRANCH, semester: s.sem, subjectName: s.name },
            create: { subjectCode: s.code, subjectName: s.name, semester: s.sem, branch: FULL_BRANCH }
        });
        subjectRecords.push(sub);
    }
    console.log(`✅ Created ${subjectRecords.length} subjects for Semester 8.`);

    // 2. Assign these subjects to the Faculty (Dr. Priya)
    const faculty = await prisma.faculty.findUnique({ where: { facultyId: FACULTY_ID } });
    if (faculty) {
        for (const sub of subjectRecords) {
            await prisma.facultySubject.upsert({
                where: {
                    facultyId_subjectId_section: {
                        facultyId: faculty.id,
                        subjectId: sub.id,
                        section: 'A'
                    }
                },
                update: {},
                create: {
                    facultyId: faculty.id,
                    subjectId: sub.id,
                    section: 'A'
                }
            });
        }
        console.log(`✅ Assigned 8th Sem subjects to Faculty ID: ${FACULTY_ID}`);
    }

    // 3. Migrate a batch of students to Semester 8
    // We'll take students from USN 050 to 070 (21 students)
    const studentsToMove = await prisma.student.findMany({
        where: { branch: FULL_BRANCH, usn: { contains: 'AIML0' } },
        take: 20
    });

    for (const student of studentsToMove) {
        await prisma.student.update({
            where: { id: student.id },
            data: { semester: 8 }
        });
    }
    console.log(`✅ Migrated 20 students to Semester 8 batch.`);

    console.log('✨ Syllabus Integration Complete! Refresh your dashboard.');
    process.exit(0);
}

ingestSyllabusToDashboard();
