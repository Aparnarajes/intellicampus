/**
 * ════════════════════════════════════════════════════════════════════════════
 *  INTELLICAMPUS — COMPREHENSIVE ACADEMIC DATA SEEDER
 *  Department : Artificial Intelligence & Machine Learning (AIML)
 *  Batch      : 2023-2027  |  Semesters: 5 & 6
 *  Students   : 70  |  Faculty: 12  |  Subjects: 6
 *  Attendance : 2 months (Jan–Feb 2026, weekdays only)
 * ════════════════════════════════════════════════════════════════════════════
 */

import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import logger from './logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Inclusive integer random. */
const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Inclusive float random, fixed to `dp` decimal places. */
const rFloat = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

/** Pick a random element from an array. */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Weighted random — weight array must parallel items array. */
const pickWeighted = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
    }
    return items[items.length - 1];
};

/** All weekday dates (Mon–Fri) between two Date objects, inclusive. */
const weekdaysBetween = (start, end) => {
    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return days;
};

/** Derive VTU-style grade from percentage. */
const gradeFromPct = (pct) => {
    if (pct >= 90) return 'S';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 40) return 'E';
    return 'F';
};

/** Faculty remark pool keyed by performance tier. */
const REMARKS = {
    excellent: [
        'Outstanding performance. Keep it up!',
        'Excellent grasp of concepts. Well done.',
        'Top scorer in the class. Exemplary work.',
        'Consistently performing at the highest level.',
        'Exceptional analytical skills demonstrated.',
    ],
    good: [
        'Good understanding of core topics.',
        'Solid performance. Minor improvements needed.',
        'Above average work. Aim for excellence.',
        'Good effort. Focus on advanced topics.',
        'Track is good. Practice more numerical problems.',
    ],
    average: [
        'Average performance. More practice required.',
        'Needs to improve conceptual clarity.',
        'Please revisit unit topics from the textbook.',
        'Attend doubt sessions to clarify weak areas.',
        'Mid-level performance. Target 75%+ in next IA.',
    ],
    poor: [
        'Below expectation. Discuss with mentor immediately.',
        'Serious improvement needed. Attend remedial classes.',
        'Submit pending assignments. Risk of detention.',
        'Performance declining. Academic counselling advised.',
        'Please meet faculty for personalized guidance.',
    ],
};

const remarkFor = (pct) => {
    if (pct >= 80) return pick(REMARKS.excellent);
    if (pct >= 65) return pick(REMARKS.good);
    if (pct >= 50) return pick(REMARKS.average);
    return pick(REMARKS.poor);
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const DEPARTMENT = 'Artificial Intelligence & Machine Learning';
const BRANCH_CODE = 'AIML';
const SECTION = 'A';
const BATCH = '2023-2027';
const DEFAULT_PASSWORD = 'Intellicampus@123';

const SUBJECTS = [
    { subjectName: 'Machine Learning',                    subjectCode: 'AIML501', semester: 5 },
    { subjectName: 'Data Mining',                         subjectCode: 'AIML502', semester: 5 },
    { subjectName: 'Deep Learning',                       subjectCode: 'AIML503', semester: 5 },
    { subjectName: 'System Software and Compiler Design', subjectCode: 'AIML504', semester: 5 },
    { subjectName: 'Cloud Computing',                     subjectCode: 'AIML505', semester: 6 },
    { subjectName: 'Artificial Intelligence',             subjectCode: 'AIML506', semester: 6 },
];

// 12 Faculty — mix of designations
const FACULTY_RAW = [
    { facultyId: 'AIML-FAC-001', fullName: 'Dr. Priya Venkataraman',  designation: 'Associate Professor', email: 'priya.venkataraman@aiml.edu',  phone: '9876543201', subjects: ['AIML501', 'AIML503'] },
    { facultyId: 'AIML-FAC-002', fullName: 'Dr. Ramesh Naidu',        designation: 'Associate Professor', email: 'ramesh.naidu@aiml.edu',         phone: '9876543202', subjects: ['AIML502', 'AIML506'] },
    { facultyId: 'AIML-FAC-003', fullName: 'Prof. Kavitha Iyer',      designation: 'Assistant Professor', email: 'kavitha.iyer@aiml.edu',          phone: '9876543203', subjects: ['AIML504'] },
    { facultyId: 'AIML-FAC-004', fullName: 'Dr. Suresh Pillai',       designation: 'Associate Professor', email: 'suresh.pillai@aiml.edu',         phone: '9876543204', subjects: ['AIML505', 'AIML501'] },
    { facultyId: 'AIML-FAC-005', fullName: 'Prof. Anitha Krishnan',   designation: 'Assistant Professor', email: 'anitha.krishnan@aiml.edu',       phone: '9876543205', subjects: ['AIML503'] },
    { facultyId: 'AIML-FAC-006', fullName: 'Dr. Deepak Sharma',       designation: 'Associate Professor', email: 'deepak.sharma@aiml.edu',         phone: '9876543206', subjects: ['AIML502', 'AIML504'] },
    { facultyId: 'AIML-FAC-007', fullName: 'Prof. Meena Sundaram',    designation: 'Assistant Professor', email: 'meena.sundaram@aiml.edu',        phone: '9876543207', subjects: ['AIML506'] },
    { facultyId: 'AIML-FAC-008', fullName: 'Dr. Arun Chakraborty',    designation: 'Associate Professor', email: 'arun.chakraborty@aiml.edu',      phone: '9876543208', subjects: ['AIML501', 'AIML502'] },
    { facultyId: 'AIML-FAC-009', fullName: 'Prof. Lavanya Mohan',     designation: 'Assistant Professor', email: 'lavanya.mohan@aiml.edu',         phone: '9876543209', subjects: ['AIML505'] },
    { facultyId: 'AIML-FAC-010', fullName: 'Dr. Vikram Patel',        designation: 'Associate Professor', email: 'vikram.patel@aiml.edu',          phone: '9876543210', subjects: ['AIML503', 'AIML506'] },
    { facultyId: 'AIML-FAC-011', fullName: 'Prof. Nandini Reddy',     designation: 'Assistant Professor', email: 'nandini.reddy@aiml.edu',         phone: '9876543211', subjects: ['AIML504', 'AIML505'] },
    { facultyId: 'AIML-FAC-012', fullName: 'Dr. Harish Balasubramanian', designation: 'Associate Professor', email: 'harish.bala@aiml.edu',        phone: '9876543212', subjects: ['AIML501', 'AIML506'] },
];

// 70 Indian-realistic student names split across 5th & 6th semester
const STUDENT_RAW = [
    // Sem 5 — 35 students (USN 001–035)
    { n: 'Aarav Mehta',           s: 5 }, { n: 'Aditi Sharma',         s: 5 },
    { n: 'Akash Patel',           s: 5 }, { n: 'Anjali Nair',          s: 5 },
    { n: 'Arjun Reddy',           s: 5 }, { n: 'Bhavna Gupta',         s: 5 },
    { n: 'Chirag Joshi',          s: 5 }, { n: 'Deepika Iyer',         s: 5 },
    { n: 'Dhruv Kapoor',          s: 5 }, { n: 'Esha Verma',           s: 5 },
    { n: 'Farhan Khan',           s: 5 }, { n: 'Gayatri Pillai',       s: 5 },
    { n: 'Harsh Tiwari',          s: 5 }, { n: 'Ishaan Bose',          s: 5 },
    { n: 'Jyoti Krishnan',        s: 5 }, { n: 'Kabir Singh',          s: 5 },
    { n: 'Komal Desai',           s: 5 }, { n: 'Lakshmi Venkat',       s: 5 },
    { n: 'Manish Sinha',          s: 5 }, { n: 'Megha Jain',           s: 5 },
    { n: 'Naman Aggarwal',        s: 5 }, { n: 'Neha Rao',             s: 5 },
    { n: 'Nikhil Kulkarni',       s: 5 }, { n: 'Pallavi Shukla',       s: 5 },
    { n: 'Pranav Mishra',         s: 5 }, { n: 'Priya Banerjee',       s: 5 },
    { n: 'Rahul Dubey',           s: 5 }, { n: 'Riya Talwar',          s: 5 },
    { n: 'Rohan Nambiar',         s: 5 }, { n: 'Sagar Pandey',         s: 5 },
    { n: 'Sakshi Chauhan',        s: 5 }, { n: 'Sameer Malhotra',      s: 5 },
    { n: 'Shreya Fernandez',      s: 5 }, { n: 'Siddharth Menon',      s: 5 },
    { n: 'Sneha Bhatt',           s: 5 },

    // Sem 6 — 35 students (USN 036–070)
    { n: 'Sourav Das',            s: 6 }, { n: 'Subhash Varma',        s: 6 },
    { n: 'Swathi Narayanan',      s: 6 }, { n: 'Tanvi Choudhury',      s: 6 },
    { n: 'Ujwal Hegde',           s: 6 }, { n: 'Usha Patil',           s: 6 },
    { n: 'Varun Srivastava',      s: 6 }, { n: 'Vidya Subramaniam',    s: 6 },
    { n: 'Vikrant Acharya',       s: 6 }, { n: 'Vinutha Rangaswamy',   s: 6 },
    { n: 'Vishal Bhardwaj',       s: 6 }, { n: 'Yamini Sundaresan',    s: 6 },
    { n: 'Yash Goswami',          s: 6 }, { n: 'Zara Hussain',         s: 6 },
    { n: 'Abhishek Tripathi',     s: 6 }, { n: 'Aishwarya Gowda',      s: 6 },
    { n: 'Amit Saxena',           s: 6 }, { n: 'Aparna Chatterjee',    s: 6 },
    { n: 'Archana Devi',          s: 6 }, { n: 'Arvind Kumar',         s: 6 },
    { n: 'Asha Ramachandran',     s: 6 }, { n: 'Ashwin Balaji',        s: 6 },
    { n: 'Balakrishna Rao',       s: 6 }, { n: 'Bhaskar Nagarajan',    s: 6 },
    { n: 'Chandana Murthy',       s: 6 }, { n: 'Chetan Mathur',        s: 6 },
    { n: 'Divya Lakshmi',         s: 6 }, { n: 'Geetha Balachandran',  s: 6 },
    { n: 'Girish Menon',          s: 6 }, { n: 'Gopal Krishnamurthy',  s: 6 },
    { n: 'Haritha Suresh',        s: 6 }, { n: 'Harishchandra Raju',   s: 6 },
    { n: 'Hemanth Kumar',         s: 6 }, { n: 'Indira Prasad',        s: 6 },
    { n: 'Jagadeesh Gowda',       s: 6 },
];

// Attendance window: Jan 2 – Feb 28, 2026 (weekdays only)
const ATTEND_START = new Date('2026-01-02');
const ATTEND_END   = new Date('2026-02-28');
const WEEKDAYS = weekdaysBetween(ATTEND_START, ATTEND_END);

// Subjects per semester
const SEM5_SUBJECTS = SUBJECTS.filter(s => s.semester === 5);
const SEM6_SUBJECTS = SUBJECTS.filter(s => s.semester === 6);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEEDER
// ─────────────────────────────────────────────────────────────────────────────

const seedAcademicData = async () => {
    // ── IDEMPOTENCY GUARD ─────────────────────────────────────────────────────
    // Skip seeding if AIML students already exist (i.e. we've seeded before)
    const existingCount = await prisma.preRegisteredStudent.count({
        where: { branch: DEPARTMENT },
    });
    if (existingCount >= STUDENT_RAW.length) {
        logger.info('ℹ️  [AcademicDataSeeder] AIML data already seeded — skipping.');
        return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    logger.info('🌱 [AcademicDataSeeder] Starting comprehensive AIML department seed...');

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // ── 1. SEED SUBJECTS ────────────────────────────────────────────────────
    logger.info('📚 Seeding subjects...');
    const subjectMap = {}; // subjectCode → Subject record

    for (const sub of SUBJECTS) {
        const record = await prisma.subject.upsert({
            where: { subjectCode: sub.subjectCode },
            update: { subjectName: sub.subjectName, semester: sub.semester, branch: BRANCH_CODE },
            create: { subjectName: sub.subjectName, subjectCode: sub.subjectCode, semester: sub.semester, branch: BRANCH_CODE },
        });
        subjectMap[sub.subjectCode] = record;
    }
    logger.info(`  ✅ ${SUBJECTS.length} subjects seeded.`);

    // ── 2. SEED PRE-REGISTERED STUDENTS (Prisma registry) ──────────────────
    logger.info('🧑‍🎓 Seeding pre-registered students...');
    for (let i = 0; i < STUDENT_RAW.length; i++) {
        const raw = STUDENT_RAW[i];
        const idx = String(i + 1).padStart(3, '0');
        const usn = `1AB23AIML${idx}`;
        const emailLocal = raw.n.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
        const email = `${emailLocal}@aiml.edu`;

        await prisma.preRegisteredStudent.upsert({
            where: { usn },
            update: {},
            create: {
                usn,
                fullName: raw.n,
                email,
                phone: `9${rInt(100000000, 999999999)}`,
                branch: DEPARTMENT,
                semester: raw.s,
                section: SECTION,
                batch: BATCH,
                admissionYear: 2023,
                isRegistered: false,
                isActive: true,
            },
        });
    }
    logger.info(`  ✅ ${STUDENT_RAW.length} pre-registered students seeded.`);

    // ── 3. SEED PRE-REGISTERED FACULTY (Prisma registry) ───────────────────
    logger.info('🧑‍🏫 Seeding pre-registered faculty...');
    for (const fac of FACULTY_RAW) {
        await prisma.preRegisteredFaculty.upsert({
            where: { facultyId: fac.facultyId },
            update: {},
            create: {
                facultyId: fac.facultyId,
                fullName: fac.fullName,
                email: fac.email,
                phone: fac.phone,
                department: DEPARTMENT,
                designation: fac.designation,
                isRegistered: false,
                isActive: true,
            },
        });
    }
    logger.info(`  ✅ ${FACULTY_RAW.length} pre-registered faculty seeded.`);

    // ── 4. SEED FACULTY USER + FACULTY PROFILE ─────────────────────────────
    logger.info('👤 Seeding faculty User accounts & Faculty profiles...');
    const facultyMap = {}; // facultyId string → Faculty record

    for (const fac of FACULTY_RAW) {
        // User account
        const user = await prisma.user.upsert({
            where: { email: fac.email },
            update: {},
            create: {
                email: fac.email,
                password: hashedPassword,
                role: 'FACULTY',
                isRegistered: true,
                isVerified: true,
                faculty: {
                    create: {
                        facultyId: fac.facultyId,
                        fullName: fac.fullName,
                        department: DEPARTMENT,
                        designation: fac.designation,
                        email: fac.email,
                        phone: fac.phone,
                    },
                },
            },
            include: { faculty: true },
        });
        facultyMap[fac.facultyId] = user.faculty;
    }
    logger.info(`  ✅ Faculty accounts ready.`);

    // ── 5. FACULTY–SUBJECT MAPPINGS ─────────────────────────────────────────
    logger.info('🔗 Creating faculty-subject mappings...');
    for (const fac of FACULTY_RAW) {
        const facRecord = facultyMap[fac.facultyId];
        if (!facRecord) continue;
        for (const code of fac.subjects) {
            const sub = subjectMap[code];
            if (!sub) continue;
            await prisma.facultySubject.upsert({
                where: {
                    facultyId_subjectId_section: {
                        facultyId: facRecord.id,
                        subjectId: sub.id,
                        section: SECTION,
                    },
                },
                update: {},
                create: { facultyId: facRecord.id, subjectId: sub.id, section: SECTION },
            });
        }
    }
    logger.info('  ✅ Faculty-subject mappings done.');

    // ── 6. SEED STUDENT USER + STUDENT PROFILE ────────────────────────────
    logger.info('🧑‍💻 Seeding student User accounts & Student profiles...');
    const studentRecords = []; // { preReg, student, cgpa, sem }

    for (let i = 0; i < STUDENT_RAW.length; i++) {
        const raw = STUDENT_RAW[i];
        const idx = String(i + 1).padStart(3, '0');
        const usn = `1AB23AIML${idx}`;
        const emailLocal = raw.n.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
        const email = `${emailLocal}@aiml.edu`;
        const cgpa = rFloat(6.5, 9.8, 2);
        const gpaFloat = cgpa;

        // Determine performance tier from CGPA (for realistic mark generation)
        // tier: 'high' >=8.5, 'mid' >=7.0, 'low' below
        const tier = gpaFloat >= 8.5 ? 'high' : gpaFloat >= 7.0 ? 'mid' : 'low';

        let userRecord;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            userRecord = await prisma.user.findUnique({ where: { email }, include: { student: true } });
        } else {
            userRecord = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'STUDENT',
                    isRegistered: true,
                    isVerified: true,
                    student: {
                        create: {
                            usn,
                            fullName: raw.n,
                            branch: DEPARTMENT,
                            semester: raw.s,
                            section: SECTION,
                            email,
                            phone: `9${rInt(100000000, 999999999)}`,
                            overallGpa: gpaFloat,
                        },
                    },
                },
                include: { student: true },
            });
        }

        if (userRecord?.student) {
            studentRecords.push({ student: userRecord.student, cgpa: gpaFloat, tier, sem: raw.s });
        }

        // Mark as registered in the pre-reg table
        await prisma.preRegisteredStudent.updateMany({
            where: { usn },
            data: { isRegistered: true },
        });
    }
    logger.info(`  ✅ ${studentRecords.length} student accounts ready.`);

    // ── 7. DETERMINE WHICH SUBJECTS EACH STUDENT TAKES ─────────────────────
    // Sem 5 students → 5th-sem subjects; Sem 6 → 6th-sem subjects
    // (Both sets are in the DB for the faculty mapping; students just take their sem's)
    const getSubjectsForStudent = (sem) =>
        sem === 5 ? SEM5_SUBJECTS : SEM6_SUBJECTS;

    // Primary faculty for grading per subject (first listed faculty for that subject)
    const primaryFacultyForSubject = (subjectCode) => {
        const fac = FACULTY_RAW.find(f => f.subjects.includes(subjectCode));
        return fac ? facultyMap[fac.facultyId] : null;
    };

    // ── 8. SEED MARKS (IA-1, IA-2, Assignment, Quiz) ───────────────────────
    logger.info('📊 Seeding marks data...');

    /** Generate marks based on student tier. */
    const genIA = (tier) => {
        if (tier === 'high') return rInt(18, 25);
        if (tier === 'mid') return rInt(12, 20);
        return rInt(7, 16);
    };
    const genAssignment = (tier) => {
        if (tier === 'high') return rInt(8, 10);
        if (tier === 'mid') return rInt(6, 9);
        return rInt(4, 7);
    };
    const genQuiz = (tier) => {
        if (tier === 'high') return rInt(7, 10);
        if (tier === 'mid') return rInt(5, 9);
        return rInt(3, 7);
    };

    for (const { student, tier } of studentRecords) {
        const subjects = student.semester === 5 ? SEM5_SUBJECTS : SEM6_SUBJECTS;
        for (const sub of subjects) {
            const subRecord = subjectMap[sub.subjectCode];
            if (!subRecord) continue;

            const ia1 = genIA(tier);
            const ia2 = genIA(tier);
            const asgn = genAssignment(tier);
            const quiz = genQuiz(tier);
            // Internal total (IA1 + IA2 + Assignment + Quiz) max = 70 (25+25+10+10)
            const internalTotal = ia1 + ia2 + asgn + quiz;
            const iaGrade = gradeFromPct((internalTotal / 70) * 100);

            // IA-1
            await prisma.evaluation.upsert({
                where: { studentId_subjectId: { studentId: student.id, subjectId: subRecord.id } },
                update: {
                    ia1Marks: ia1,
                    ia2Marks: ia2,
                    assignmentMarks: asgn,
                    quizMarks: quiz,
                    totalMarks: internalTotal,
                    grade: iaGrade,
                    remarks: "Seeded"
                },
                create: { 
                    studentId: student.id, 
                    subjectId: subRecord.id, 
                    facultyId: (await prisma.facultySubject.findFirst({ where: { subjectId: subRecord.id } }))?.facultyId || (await prisma.faculty.findFirst()).id,
                    semester: student.semester,
                    ia1Marks: ia1,
                    ia2Marks: ia2,
                    assignmentMarks: asgn,
                    quizMarks: quiz,
                    totalMarks: internalTotal,
                    grade: iaGrade,
                    remarks: "Seeded"
                },
            });
            // The Evaluation model stores all marks in a single row.
        }
    }
    logger.info('  ✅ Marks seeded (IA-1, IA-2, Assignment, Quiz, Internal-Total).');

    // ── 9. SEED ATTENDANCE (2 months of weekdays) ──────────────────────────
    logger.info(`📅 Seeding attendance for ${WEEKDAYS.length} weekdays per student per subject...`);

    let totalAttendanceRows = 0;
    let processedStudents = 0;

    for (const { student, tier } of studentRecords) {
        const subjects = student.semester === 5 ? SEM5_SUBJECTS : SEM6_SUBJECTS;

        for (const sub of subjects) {
            const subRecord = subjectMap[sub.subjectCode];
            if (!subRecord) continue;

            // Target percentage: high = 85–95%, mid = 75–90%, low = 70–82%
            const targetPct = tier === 'high' ? rFloat(85, 95, 1)
                : tier === 'mid' ? rFloat(75, 90, 1)
                    : rFloat(70, 82, 1);

            const totalDays = WEEKDAYS.length;
            const presentDays = Math.round((targetPct / 100) * totalDays);

            // Shuffle to randomise absent days
            const shuffled = [...WEEKDAYS].sort(() => Math.random() - 0.5);
            const presentSet = new Set(shuffled.slice(0, presentDays).map(d => d.toISOString().slice(0, 10)));

            // SQLite Prisma doesn't support createMany + skipDuplicates → use upsert per row
            for (const day of WEEKDAYS) {
                const dateKey = day.toISOString().slice(0, 10);
                const status = presentSet.has(dateKey) ? 'PRESENT' : 'ABSENT';
                // Unique constraint: [studentId, subjectId, date]
                await prisma.attendance.upsert({
                    where: {
                        studentId_subjectId_date: {
                            studentId: student.id,
                            subjectId: subRecord.id,
                            date: day,
                        },
                    },
                    update: {},
                    create: {
                        studentId: student.id,
                        subjectId: subRecord.id,
                        date: day,
                        status,
                    },
                });
                totalAttendanceRows++;
            }
        }

        processedStudents++;
        if (processedStudents % 10 === 0) {
            logger.info(`  ⏳ Attendance progress: ${processedStudents}/${studentRecords.length} students (${totalAttendanceRows} rows so far)...`);
        }
    }
    logger.info(`  ✅ ${totalAttendanceRows} attendance records seeded.`);

    // ── 10. SEED ASSIGNMENTS ────────────────────────────────────────────────
    logger.info('📝 Seeding assignments...');
    const assignmentTitles = {
        AIML501: ['ML Model Building with Scikit-learn', 'Regression Analysis on Housing Dataset'],
        AIML502: ['Data Preprocessing & Feature Engineering', 'Clustering using K-Means and DBSCAN'],
        AIML503: ['CNN Image Classification Project', 'RNN-based Sentiment Analysis'],
        AIML504: ['Lexical Analyser Implementation', 'Intermediate Code Generation for Simple Expressions'],
        AIML505: ['AWS EC2 Deployment Lab', 'Kubernetes Pod Orchestration Exercise'],
        AIML506: ['A* Search Algorithm Implementation', 'Bayesian Network Reasoning Assignment'],
    };

    const assignmentMap = {}; // subjectCode → [Assignment records]
    for (const sub of SUBJECTS) {
        const subRecord = subjectMap[sub.subjectCode];
        assignmentMap[sub.subjectCode] = [];
        const titles = assignmentTitles[sub.subjectCode] || ['Assignment 1', 'Assignment 2'];
        for (const title of titles) {
            // Check for existing assignment to prevent duplicates on partial runs
            let rec = await prisma.assignment.findFirst({
                where: { subjectId: subRecord.id, title: title }
            });

            if (!rec) {
                // Due date: 4–6 weeks after window start
                const dueDays = rInt(28, 42);
                const dueDate = new Date(ATTEND_START);
                dueDate.setDate(dueDate.getDate() + dueDays);

                rec = await prisma.assignment.create({
                    data: { subjectId: subRecord.id, title, dueDate },
                });
            }
            assignmentMap[sub.subjectCode].push(rec);
        }
    }
    logger.info('  ✅ Assignments created.');

    // ── 11. SEED ASSIGNMENT SUBMISSIONS ────────────────────────────────────
    logger.info('📤 Seeding assignment submissions...');
    let totalSubmissions = 0;

    for (const { student, tier } of studentRecords) {
        const studentSubjects = student.semester === 5 ? SEM5_SUBJECTS : SEM6_SUBJECTS;
        for (const sub of studentSubjects) {
            const assignments = assignmentMap[sub.subjectCode] || [];
            for (const asgn of assignments) {
                // High tier = 95% chance submitted; mid = 85%; low = 70%
                const submits = Math.random() < (tier === 'high' ? 0.95 : tier === 'mid' ? 0.85 : 0.70);
                const score = submits
                    ? genAssignment(tier) * 1.0   // reuse assignment score helper (0–10)
                    : null;

                await prisma.assignmentSubmission.upsert({
                    where: { assignmentId_studentId: { assignmentId: asgn.id, studentId: student.id } },
                    update: {},
                    create: {
                        assignmentId: asgn.id,
                        studentId: student.id,
                        submissionStatus: submits ? 'SUBMITTED' : 'NOT_SUBMITTED',
                        marksAwarded: score,
                    },
                });
                totalSubmissions++;
            }
        }
    }
    logger.info(`  ✅ ${totalSubmissions} assignment submissions seeded.`);

    // ── 12. UPDATE STUDENT overallAttendancePercentage & riskFlag ──────────
    logger.info('🔄 Recalculating student-level attendance aggregates...');
    for (const { student } of studentRecords) {
        const allRecords = await prisma.attendance.findMany({ where: { studentId: student.id } });
        if (allRecords.length === 0) continue;
        const presentCount = allRecords.filter(r => r.status === 'PRESENT').length;
        const overallPct = parseFloat(((presentCount / allRecords.length) * 100).toFixed(2));
        await prisma.student.update({
            where: { id: student.id },
            data: {
                overallAttendancePercentage: overallPct,
                riskFlag: overallPct < 75,
            },
        });
    }
    logger.info('  ✅ Attendance aggregates updated.');

    // ── 13. MENTORSHIP ASSIGNMENT (implicit via faculty-subject) ─────────────
    // We log a mentorship JSON summary — stored as a structured output for reference.
    // Formal mentorship is tracked in separate workflows in this system.
    logger.info('🤝 Building mentorship assignments...');
    const mentorshipLog = [];
    const shuffledStudents = [...studentRecords].sort(() => Math.random() - 0.5);
    let studentPool = [...shuffledStudents];

    for (const fac of FACULTY_RAW) {
        const count = rInt(5, 8);
        const mentees = studentPool.splice(0, count);
        for (const { student } of mentees) {
            const startDate = new Date(`2026-01-${String(rInt(2, 15)).padStart(2, '0')}`);
            mentorshipLog.push({
                faculty_id: fac.facultyId,
                faculty_name: fac.fullName,
                student_id: student.usn,
                student_name: student.fullName,
                mentorship_start_date: startDate.toISOString().slice(0, 10),
            });
        }
        if (studentPool.length === 0) break;
    }

    logger.info(`  ✅ Mentorship mappings created for ${mentorshipLog.length} student-faculty pairs.`);

    // ── 14. EVALUATION SUMMARY LOG ──────────────────────────────────────────
    logger.info('📋 Building faculty evaluation remarks...');
    const evaluationLog = [];

    for (const { student, tier } of studentRecords) {
        const subjects = student.semester === 5 ? SEM5_SUBJECTS : SEM6_SUBJECTS;
        for (const sub of subjects) {
            const fac = FACULTY_RAW.find(f => f.subjects.includes(sub.subjectCode));
            if (!fac) continue;
            const ia1 = genIA(tier);
            const ia2 = genIA(tier);
            const asgn = genAssignment(tier);
            const quiz = genQuiz(tier);
            const internalTotal = ia1 + ia2 + asgn + quiz;
            const pct = (internalTotal / 70) * 100;
            evaluationLog.push({
                faculty_id: fac.facultyId,
                faculty_name: fac.fullName,
                student_usn: student.usn,
                student_name: student.fullName,
                subject: sub.subjectName,
                ia1_score: ia1,
                ia2_score: ia2,
                assignment_score: asgn,
                quiz_score: quiz,
                internal_total: internalTotal,
                max_internal: 70,
                percentage: parseFloat(pct.toFixed(2)),
                grade: gradeFromPct(pct),
                faculty_remarks: remarkFor(pct),
            });
        }
    }

    logger.info(`  ✅ ${evaluationLog.length} evaluation records generated.`);

    // ── 15. PERSIST SUPPLEMENTARY JSON DATA ─────────────────────────────────
    // Save mentorship + evaluation to data/ folder as reference JSON files
    // (also useful for the frontend admin panel or reports)
    const { writeFile, mkdir } = await import('fs/promises');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const dataDir = join(__dirname, '..', 'data');

    try {
        await mkdir(dataDir, { recursive: true });

        await writeFile(
            join(dataDir, 'mentorshipData.json'),
            JSON.stringify({ generated_at: new Date().toISOString(), records: mentorshipLog }, null, 2),
            'utf8'
        );

        await writeFile(
            join(dataDir, 'evaluationData.json'),
            JSON.stringify({ generated_at: new Date().toISOString(), records: evaluationLog }, null, 2),
            'utf8'
        );

        // Also persist a student directory JSON (useful for the admin seeding panel)
        const studentDirectory = studentRecords.map(({ student, cgpa, sem }, i) => ({
            student_id: student.usn,
            student_name: student.fullName,
            department: DEPARTMENT,
            semester: sem,
            cgpa,
            email: student.email,
            phone: student.phone,
            section: SECTION,
            batch: BATCH,
        }));

        await writeFile(
            join(dataDir, 'studentDirectory.json'),
            JSON.stringify({ generated_at: new Date().toISOString(), total: studentDirectory.length, students: studentDirectory }, null, 2),
            'utf8'
        );

        // Faculty directory
        const facultyDirectory = FACULTY_RAW.map(fac => ({
            faculty_id: fac.facultyId,
            faculty_name: fac.fullName,
            designation: fac.designation,
            department: DEPARTMENT,
            email: fac.email,
            phone: fac.phone,
            subjects_taught: fac.subjects.map(code => SUBJECTS.find(s => s.subjectCode === code)?.subjectName || code),
        }));

        await writeFile(
            join(dataDir, 'facultyDirectory.json'),
            JSON.stringify({ generated_at: new Date().toISOString(), total: facultyDirectory.length, faculty: facultyDirectory }, null, 2),
            'utf8'
        );

        logger.info('  ✅ JSON reference files saved to backend/data/');
    } catch (fileErr) {
        logger.warn(`  ⚠️  Could not write JSON files: ${fileErr.message}`);
    }

    // ── FINAL SUMMARY ────────────────────────────────────────────────────────
    logger.info('');
    logger.info('════════════════════════════════════════════════════════════════');
    logger.info('  🎓 INTELLICAMPUS — ACADEMIC DATA SEED COMPLETE');
    logger.info('════════════════════════════════════════════════════════════════');
    logger.info(`  📚 Subjects        : ${SUBJECTS.length}`);
    logger.info(`  🧑‍🎓 Students        : ${studentRecords.length} (Sem 5: 35, Sem 6: 35)`);
    logger.info(`  🧑‍🏫 Faculty         : ${FACULTY_RAW.length}`);
    logger.info(`  📅 Attendance Days : ${WEEKDAYS.length} weekdays (Jan–Feb 2026)`);
    logger.info(`  📊 Attendance rows : ${totalAttendanceRows}`);
    logger.info(`  📝 Submissions     : ${totalSubmissions}`);
    logger.info(`  🤝 Mentorships     : ${mentorshipLog.length}`);
    logger.info(`  📋 Evaluations     : ${evaluationLog.length}`);
    logger.info('════════════════════════════════════════════════════════════════');
};

export default seedAcademicData;
