import prisma from '../backend/config/prisma.js';

async function restoreWorkload() {
    console.log('👷 Restoring Faculty Workload for Dr. Priya Venkataraman...');

    const FACULTY_ID = "48200c9a-3401-4ae3-9b56-f9df8d681c10"; // Internal ID for Dr. Priya
    const DEPARTMENT = 'Artificial Intelligence & Machine Learning';

    // Get all subjects created by the comprehensive seeder (plus others in the system)
    const subjects = await prisma.subject.findMany({
        where: { branch: DEPARTMENT }
    });

    console.log(`Found ${subjects.length} subjects in the system.`);

    if (subjects.length === 0) {
        console.error('❌ No subjects found! Run full_syllabus_sync.mjs first.');
        process.exit(1);
    }

    // Assign a reasonable set of subjects to Dr. Priya
    // Let's give her 4-5 subjects from various semesters
    const workload = subjects.slice(0, 8); // Give her the first 8 subjects for variety

    for (const sub of workload) {
        await prisma.facultySubject.upsert({
            where: {
                facultyId_subjectId_section: {
                    facultyId: FACULTY_ID,
                    subjectId: sub.id,
                    section: 'A'
                }
            },
            update: {},
            create: {
                facultyId: FACULTY_ID,
                subjectId: sub.id,
                section: 'A'
            }
        });
        console.log(`✅ Assigned: ${sub.subjectName} (${sub.subjectCode})`);
    }

    console.log('✨ Workload restored! The dashboard should work now.');
    process.exit(0);
}

restoreWorkload().catch(err => {
    console.error(err);
    process.exit(1);
});
