import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import logger from './logger.js';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const rInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rFloat = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

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

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const DEPARTMENT = 'Artificial Intelligence & Machine Learning';
const BRANCH_CODE = 'AIML';
const SECTIONS = ['A', 'B'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female'];
const SUBJECTS = [
    { name: 'Discrete Mathematics', code: '23SAL031', sem: 3 },
    { name: 'Data Structures-1', code: '23SAL032', sem: 3 },
    { name: 'Software Engineering with AI', code: '23SAL041', sem: 4 },
    { name: 'Database Management Systems', code: '23SAL042', sem: 4 },
    { name: 'Artificial Neural Networks', code: '23SAL051', sem: 5 },
    { name: 'Operating Systems', code: '23SAL052', sem: 5 },
    { name: 'Deep Learning Techniques', code: '23SAL061', sem: 6 },
    { name: 'System Software & Compiler Design', code: '23SAL062', sem: 6 },
];

const FIRST_NAMES = ['Aarav', 'Aditya', 'Akash', 'Anjali', 'Arjun', 'Bhavna', 'Chirag', 'Deepika', 'Dhruv', 'Esha', 'Farhan', 'Gayatri', 'Harsh', 'Ishaan', 'Jyoti', 'Kabir', 'Komal', 'Lakshmi', 'Manish', 'Megha', 'Naman', 'Neha', 'Nikhil', 'Pallavi', 'Pranav', 'Priya', 'Rahul', 'Riya', 'Rohan', 'Sagar', 'Sakshi', 'Sameer', 'Shreya', 'Siddharth', 'Sneha', 'Sourav', 'Subhash', 'Swathi', 'Tanvi', 'Ujwal', 'Varun', 'Vidya', 'Vikrant', 'Vishal', 'Yash', 'Zara'];
const LAST_NAMES = ['Mehta', 'Sharma', 'Patel', 'Nair', 'Reddy', 'Gupta', 'Joshi', 'Iyer', 'Kapoor', 'Verma', 'Khan', 'Pillai', 'Tiwari', 'Bose', 'Krishnan', 'Singh', 'Desai', 'Venkat', 'Sinha', 'Jain', 'Aggarwal', 'Rao', 'Kulkarni', 'Shukla', 'Mishra', 'Banerjee', 'Dubey', 'Talwar', 'Nambiar', 'Pandey', 'Chauhan', 'Malhotra', 'Fernandez', 'Menon', 'Bhatt', 'Das', 'Acharya', 'Bhardwaj', 'Goswami'];

const ADDRESSES = [
    '123, MG Road, Bangalore', '45, Residency Road, Bangalore', '78, Koramangala, Bangalore',
    '32, Indiranagar, Bangalore', '56, Whitefield, Bangalore', '89, Jayanagar, Bangalore',
    '12, JP Nagar, Bangalore', '67, HSR Layout, Bangalore', '43, Malleshwaram, Bangalore'
];

const REMARKS = ['Excellent effort', 'Consistent performance', 'Attentive in class', 'Good participation', 'Needs more practice', 'Solid grasp of concepts', 'Shows great potential', 'Regularly participates'];

const seedComprehensiveData = async () => {
    logger.info('🚀 Starting Comprehensive Academic Seeder...');

    const hashedPassword = await bcrypt.hash('Intellicampus@123', 12);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const weekdays = weekdaysBetween(twoMonthsAgo, new Date());

    // 1. Clear existing data to ensure clean state for 80 students
    await prisma.marks.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.assignmentSubmission.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.facultySubject.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.user.deleteMany({ where: { role: 'STUDENT' } });

    // 2. Ensure Subjects exist
    const subIdMap = {};
    for (const s of SUBJECTS) {
        const rec = await prisma.subject.upsert({
            where: { subjectCode: s.code },
            update: { semester: s.sem, branch: DEPARTMENT },
            create: { subjectName: s.name, subjectCode: s.code, semester: s.sem, branch: DEPARTMENT }
        });
        subIdMap[s.code] = rec.id;
    }

    // 3. Generate 80 Students
    logger.info('🧑‍🎓 Generating 80 detailed student records...');
    for (let i = 1; i <= 80; i++) {
        const fName = pick(FIRST_NAMES);
        const lName = pick(LAST_NAMES);
        const fullName = `${fName} ${lName}`;
        const usn = `1AB23AIML${String(i).padStart(3, '0')}`;
        const regNo = `REG2023${String(i).padStart(4, '0')}`;
        const gender = pick(GENDERS);
        const dob = rDate(new Date('2003-01-01'), new Date('2005-12-31'));
        const sem = rInt(3, 6);
        const section = pick(SECTIONS);
        const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@aiml.edu`;
        const phone = `9${rInt(100000000, 999999999)}`;
        const address = pick(ADDRESSES);
        const bloodGroup = pick(BLOOD_GROUPS);
        const cgpa = rFloat(6.0, 9.8);
        const admissionYear = 2023;

        // Parents
        const faName = `${pick(FIRST_NAMES)} ${lName}`;
        const moName = `${pick(FIRST_NAMES)} ${lName}`;
        const paPhone = `8${rInt(100000000, 999999999)}`;

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'STUDENT',
                isRegistered: true,
                student: {
                    create: {
                        usn,
                        registrationNumber: regNo,
                        fullName,
                        gender,
                        dateOfBirth: dob,
                        branch: DEPARTMENT,
                        semester: sem,
                        section,
                        email,
                        phone,
                        address,
                        bloodGroup,
                        fatherName: faName,
                        fatherPhone: paPhone,
                        motherName: moName,
                        motherPhone: paPhone,
                        admissionYear,
                        overallGpa: cgpa,
                    }
                }
            },
            include: { student: true }
        });

        const studentId = user.student.id;

        // 4. Generate Attendance & Marks for each subject in their semester
        const semSubjects = SUBJECTS.filter(s => s.sem === sem);
        for (const sub of semSubjects) {
            const subjectId = subIdMap[sub.code];

            // Attendance - last 2 months (70-95%)
            const attendPercent = rInt(70, 95);
            for (const date of weekdays) {
                const status = Math.random() * 100 <= attendPercent ? 'PRESENT' : 'ABSENT';
                await prisma.attendance.create({
                    data: {
                        studentId,
                        subjectId,
                        date,
                        status
                    }
                });
            }

            // Marks
            const tests = ['IA-1', 'IA-2', 'Assignment', 'Quiz'];
            for (const test of tests) {
                const max = test.startsWith('IA') ? 50 : 10;
                const score = rInt(Math.floor(max * 0.4), max); 
                await prisma.marks.create({
                    data: {
                        studentId,
                        subjectId,
                        testType: test,
                        marks: score,
                        maxMarks: max,
                        grade: score >= (max * 0.9) ? 'S' : (score >= (max * 0.8) ? 'A' : 'B')
                    }
                });
            }
        }
    }

    logger.info('✅ Comprehensive Seeding complete! 80 students with detailed records created.');
};

export default seedComprehensiveData;
