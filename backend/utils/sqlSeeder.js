import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import logger from './logger.js';

/**
 * SQL_SEEDER.js
 * Populates the SQLite database with Subjects, Mappings, and Academic Data.
 */

const seedAcademicERP = async () => {
    try {
        logger.info('🌱 Starting SQL Data Seeding...');

        // 1. Create Subjects
        const subjects = [
            { subjectName: 'Operating Systems', subjectCode: 'CS401', semester: 4, branch: 'CS' },
            { subjectName: 'Database Systems', subjectCode: 'CS402', semester: 4, branch: 'CS' },
            { subjectName: 'Computer Networks', subjectCode: 'CS403', semester: 4, branch: 'CS' },
        ];

        for (const s of subjects) {
            await prisma.subject.upsert({
                where: { subjectCode: s.subjectCode },
                update: {},
                create: s
            });
        }
        logger.info('✅ Subjects Seeded.');

        // 2. Create a Test Student (Aditya Kumar - 1AB22CS001)
        const hashedPassword = await bcrypt.hash('intellicampus8187', 12);

        const studentUser = await prisma.user.upsert({
            where: { email: 'aditya.cs22@university.edu' },
            update: {},
            create: {
                email: 'aditya.cs22@university.edu',
                password: hashedPassword,
                role: 'STUDENT',
                isRegistered: true,
                student: {
                    create: {
                        usn: '1AB22CS001',
                        fullName: 'Aditya Kumar',
                        branch: 'CS',
                        semester: 4,
                        section: 'A',
                        email: 'aditya.cs22@university.edu'
                    }
                }
            },
            include: { student: true }
        });
        logger.info('✅ Test Student Seeded.');

        // 3. Create a Test Faculty (Dr. Sarah Wilson - FAC2022001)
        const facultyUserCheck = await prisma.user.findUnique({ 
            where: { email: 'sarah.wilson@university.edu' },
            include: { faculty: true } 
        });
        let facultyUser = facultyUserCheck;

        if (!facultyUser) {
            facultyUser = await prisma.user.create({
                data: {
                    email: 'sarah.wilson@university.edu',
                    password: hashedPassword,
                    role: 'FACULTY',
                    isRegistered: true,
                    faculty: {
                        create: {
                            facultyId: 'FAC2022001',
                            fullName: 'Dr. Sarah Wilson',
                            department: 'CS',
                            designation: 'Professor',
                            email: 'sarah.wilson@university.edu'
                        }
                    }
                },
                include: { faculty: true }
            });
        }
        logger.info('✅ Test Faculty Seeded.');

        // 4. Map Faculty to Subject
        const osSubject = await prisma.subject.findUnique({ where: { subjectCode: 'CS401' } });
        if (osSubject && facultyUser.faculty) {
            await prisma.facultySubject.upsert({
                where: {
                    facultyId_subjectId_section: {
                        facultyId: facultyUser.faculty.id,
                        subjectId: osSubject.id,
                        section: 'A'
                    }
                },
                update: {},
                create: {
                    facultyId: facultyUser.faculty.id,
                    subjectId: osSubject.id,
                    section: 'A'
                }
            });
        }
        logger.info('✅ Faculty Mappings Seeded.');

        // 5. Add Sample Attendance & Marks (To trigger Analytics warnings)
        if (studentUser.student && osSubject) {
            // Low attendance sample — use upsert to avoid duplicate constraint on restart
            for (const [date, status] of [
                ['2026-03-01', 'ABSENT'],
                ['2026-03-02', 'ABSENT'],
            ]) {
                await prisma.attendance.upsert({
                    where: {
                        studentId_subjectId_date: {
                            studentId: studentUser.student.id,
                            subjectId: osSubject.id,
                            date: new Date(date),
                        },
                    },
                    update: {},
                    create: {
                        studentId: studentUser.student.id,
                        subjectId: osSubject.id,
                        date: new Date(date),
                        status,
                    },
                });
            }

            // Sample Evaluation
            await prisma.evaluation.upsert({
                where: {
                    studentId_subjectId: {
                        studentId: studentUser.student.id,
                        subjectId: osSubject.id,
                    }
                },
                update: {},
                create: {
                    studentId: studentUser.student.id,
                    subjectId: osSubject.id,
                    facultyId: facultyUser.faculty.id,
                    semester: 4,
                    ia1Marks: 15,
                    totalMarks: 15,
                    grade: 'F',
                    remarks: 'Poor performance in IA-1'
                }
            });
        }
        logger.info('✅ Academic Sample Data Seeded.');

    } catch (error) {
        logger.error('❌ Seeding Error:', error);
    }
};

export default seedAcademicERP;
