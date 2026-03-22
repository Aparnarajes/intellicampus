import prisma from '../config/prisma.js';
import logger from './logger.js';

/**
 * seedPreRegistrationData — SQL / Prisma Edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds sample USNs and Faculty IDs into the sealed registry.
 * These are the ONLY IDs that can register on the platform.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const seedPreRegistrationData = async () => {
    try {
        const studentCount = await prisma.preRegisteredStudent.count();
        const facultyCount = await prisma.preRegisteredFaculty.count();

        if (studentCount > 0 && facultyCount > 0) {
            return; // Already seeded
        }

        // Sample Students
        const sampleStudents = [
            {
                usn: '1AB22CS001',
                fullName: 'Aditya Kumar',
                email: 'aditya.cs22@university.edu',
                branch: 'Computer Science',
                semester: 4,
                section: 'A',
                batch: '2022-2026',
            },
            {
                usn: '1AB22CS002',
                fullName: 'Neha Sharma',
                email: 'neha.cs22@university.edu',
                branch: 'Computer Science',
                semester: 4,
                section: 'B',
                batch: '2022-2026',
            },
            {
                usn: '1AB22IS050',
                fullName: 'Rahul Varma',
                email: 'rahul.is22@university.edu',
                branch: 'Information Science',
                semester: 4,
                section: 'A',
                batch: '2022-2026',
            }
        ];

        // Sample Faculty
        const sampleFaculty = [
            {
                facultyId: 'FAC2022001',
                fullName: 'Dr. Sarah Wilson',
                email: 'sarah.wilson@university.edu',
                department: 'Computer Science',
                designation: 'HOD'
            },
            {
                facultyId: 'FAC2022002',
                fullName: 'Prof. Michael Brown',
                email: 'm.brown@university.edu',
                department: 'Information Science',
                designation: 'Assistant Professor'
            }
        ];

        if (studentCount === 0) {
            for (const s of sampleStudents) {
                await prisma.preRegisteredStudent.upsert({
                    where: { usn: s.usn },
                    update: {},
                    create: s
                });
            }
            logger.info('✅ Pre-registered Students Registry Seeded (SQL)');
        }

        if (facultyCount === 0) {
            for (const f of sampleFaculty) {
                await prisma.preRegisteredFaculty.upsert({
                    where: { facultyId: f.facultyId },
                    update: {},
                    create: f
                });
            }
            logger.info('✅ Pre-registered Faculty Registry Seeded (SQL)');
        }

    } catch (error) {
        logger.error(`❌ Pre-registration Seeding Error: ${error.message}`);
    }
};

export default seedPreRegistrationData;
