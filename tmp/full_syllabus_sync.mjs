import prisma from '../backend/config/prisma.js';

async function syncFullSyllabus() {
    console.log('🚀 Synchronizing Full Syllabus from Markdown & PDF...');

    const FULL_BRANCH = "Artificial Intelligence & Machine Learning";
    const FACULTY_ID = "AIML-FAC-001"; // Dr. Priya Venkataraman

    const syllabus = [
        
        // Sem 3
        { code: '23SAL031', name: 'Discrete Mathematics & Graph Theory', sem: 3 },
        { code: '23SAL032', name: 'Data Structures-1', sem: 3 },
        { code: '23SAL033', name: 'OOP using JAVA', sem: 3 },
        { code: '23SAL034', name: 'Microprocessors', sem: 3 },
        { code: '23SAL035', name: 'Principles of AI', sem: 3 },
        // Sem 4
        { code: '23SAL041', name: 'Software Engineering with AI', sem: 4 },
        { code: '23SAL042', name: 'Database Management Systems', sem: 4 },
        { code: '23SAL043', name: 'Data Structures-2', sem: 4 },
        { code: '23SAL044', name: 'Fundamentals of Machine Learning', sem: 4 },
        // Sem 5
        { code: '23SAL051', name: 'Artificial Neural Networks', sem: 5 },
        { code: '23SAL052', name: 'Operating Systems', sem: 5 },
        { code: '23SAL053', name: 'Computer Networks', sem: 5 },
        { code: '23SAL054', name: 'Design and Analysis of Algorithms', sem: 5 },
        { code: '23SAL055', name: 'Introduction to Data Science', sem: 5 },
        // Sem 6
        { code: '23SAL061', name: 'Deep Learning Techniques', sem: 6 },
        { code: '23SAL062', name: 'System Software & Compiler Design', sem: 6 },
        { code: '23SAL063', name: 'Internet of Things', sem: 6 },
        // Sem 7
        { code: '23SAL071', name: 'Cloud Computing', sem: 7 },
        { code: '23SAL072', name: 'Advanced DBMS & NoSQL', sem: 7 },
        { code: '23SAL073', name: 'Natural Language Processing', sem: 7 },
        { code: '23SAL074', name: 'Distributed Systems', sem: 7 },
        { code: '23SAL075', name: 'Reinforcement Learning', sem: 7 },
        // Sem 8 (PDF Orientation)
        { code: '23SAL081', name: 'Internship-3 ', sem: 8 },
        { code: '23SAL082', name: 'Major Project Phase-2', sem: 8 },
        { code: '23SAL083', name: 'Technical Seminar', sem: 8 }
    ];

    // 1. Create All Subjects
    const subjectRecords = [];
    for (const s of syllabus) {
        const sub = await prisma.subject.upsert({
            where: { subjectCode: s.code },
            update: { subjectName: s.name, semester: s.sem, branch: FULL_BRANCH },
            create: { subjectCode: s.code, subjectName: s.name, semester: s.sem, branch: FULL_BRANCH }
        });
        subjectRecords.push(sub);
    }
    console.log(`✅ Synced ${subjectRecords.length} subjects into the system.`);

    // 2. Assign All to Dr. Priya (for testing/demo)
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
        console.log(`✅ Assigned full syllabus to Faculty: ${faculty.fullName}`);
    }

    // 3. Re-distribute 70 students across semesters 3–8
    const students = await prisma.student.findMany({ where: { branch: FULL_BRANCH } });
    const semesters = [3, 4, 5, 6, 7, 8];
    for (let i = 0; i < students.length; i++) {
        const sem = semesters[i % semesters.length];
        await prisma.student.update({
            where: { id: students[i].id },
            data: { semester: sem }
        });
    }
    console.log(`✅ Distributed ${students.length} students across 6 batches (Sem 3–8).`);

    console.log('✨ System is now fully syllabus-oriented. Refresh your dashboard!');
    process.exit(0);
}

syncFullSyllabus().catch(err => {
    console.error(err);
    process.exit(1);
});
