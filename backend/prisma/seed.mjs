import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number in range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Data Lists for realism
const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Ayaan', 'Krishna', 'Reyansh', 'Aryan', 'Ananya', 'Diya', 'Saanvi', 'Kiara', 'Myra', 'Aadhya', 'Anika', 'Riya', 'Zara', 'Sara'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Deshmukh', 'Kulkarni', 'Joshi', 'Chaudhary', 'Yadav', 'Malhotra', 'Bose', 'Das', 'Sen', 'Rao', 'Agarwal', 'Kapoor'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const designations = ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD'];
const genders = ['Male', 'Female', 'Non-binary'];
const addresses = [
  '123, MG Road, Bangalore, Karnataka',
  '45/1, Indiranagar 100ft Road, Bangalore',
  'Near Christ College, Hosur Road, Bangalore',
  'HSR Layout Sector 2, Bangalore',
  'Whitefield Main Road, Near ITPL, Bangalore',
  'Malleshwaram 15th Cross, Bangalore',
  'Jayanagar 4th Block, Bangalore',
  'Bannerghatta Road, Near Meenakshi Mall, Bangalore'
];

const syllabusData = [
  { code: '23SAL011', name: 'Engineering Mathematics-1', sem: 1 },
  { code: '23SAL012', name: 'Engineering Physics', sem: 1 },
  { code: '23SAL013', name: 'Basic Electrical Engineering', sem: 1 },
  { code: '23SAL014', name: 'Elements of Civil Engineering', sem: 1 },
  
  { code: '23SAL021', name: 'Engineering Mathematics-2', sem: 2 },
  { code: '23SAL022', name: 'Engineering Chemistry', sem: 2 },
  { code: '23SAL023', name: 'Computer Programming', sem: 2 },
  { code: '23SAL024', name: 'Elements of Mechanical Engineering', sem: 2 },

  { code: '23SAL031', name: 'Discrete Mathematics & Graph Theory', sem: 3 },
  { code: '23SAL032', name: 'Data Structures-1', sem: 3 },
  { code: '23SAL033', name: 'OOP using JAVA', sem: 3 },
  { code: '23SAL034', name: 'Microprocessors', sem: 3 },
  { code: '23SAL035', name: 'Principles of AI', sem: 3 },
  
  { code: '23SAL041', name: 'Software Engineering with AI', sem: 4 },
  { code: '23SAL042', name: 'Database Management Systems', sem: 4 },
  { code: '23SAL043', name: 'Data Structures-2', sem: 4 },
  { code: '23SAL044', name: 'Fundamentals of Machine Learning', sem: 4 },
  
  { code: '23SAL051', name: 'Artificial Neural Networks', sem: 5 },
  { code: '23SAL052', name: 'Operating Systems', sem: 5 },
  { code: '23SAL053', name: 'Computer Networks', sem: 5 },
  { code: '23SAL054', name: 'Design and Analysis of Algorithms', sem: 5 },
  { code: '23SAL055', name: 'Introduction to Data Science', sem: 5 },
  
  { code: '23SAL061', name: 'Deep Learning Techniques', sem: 6 },
  { code: '23SAL062', name: 'System Software & Compiler Design', sem: 6 },
  { code: '23SAL063', name: 'Internet of Things', sem: 6 },
  
  { code: '23SAL071', name: 'Cloud Computing', sem: 7 },
  { code: '23SAL072', name: 'Advanced DBMS & NoSQL', sem: 7 },
  { code: '23SAL073', name: 'Natural Language Processing', sem: 7 },
  { code: '23SAL074', name: 'Distributed Systems', sem: 7 },
  { code: '23SAL075', name: 'Reinforcement Learning', sem: 7 },
  
  { code: '23SAL081', name: 'Internship-3', sem: 8 },
  { code: '23SAL082', name: 'Major Project Phase-2', sem: 8 },
  { code: '23SAL083', name: 'Technical Seminar', sem: 8 }
];

async function main() {
  console.log('--- Starting Seed Process ---');

  // 1. Cleanup existing data
  console.log('Cleaning up old data...');
  await prisma.attendance.deleteMany();
  await prisma.marks.deleteMany();
  await prisma.facultySubject.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany(); // Resetting subjects too
  await prisma.loginToken.deleteMany();

  // 2. Populate Subjects (Syllabus Integration)
  console.log('Populating Subjects (Syllabus)...');
  const subjects = [];
  for (const s of syllabusData) {
    const sub = await prisma.subject.create({
      data: {
        subjectCode: s.code,
        subjectName: s.name,
        semester: s.sem,
        branch: 'Artificial Intelligence & Machine Learning'
      }
    });
    subjects.push(sub);
  }

  // 3. Generate Faculty (30 members)
  console.log('Generating 30 Faculty members...');
  const facultyList = [];
  for (let i = 1; i <= 30; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const email = `faculty.${firstName.toLowerCase()}.${i}@intellicampus.com`;
    const facultyIdStr = `FAC${2020 + randomInt(0, 5)}${String(i).padStart(3, '0')}`;

    const user = await prisma.user.create({
      data: {
        email,
        password: 'hashed_password_placeholder',
        role: Role.FACULTY,
        isRegistered: true,
      }
    });

    const faculty = await prisma.faculty.create({
      data: {
        facultyId: facultyIdStr,
        fullName,
        email,
        phone: `+91 ${randomInt(7000, 9999)}${randomInt(100000, 999999)}`,
        department: 'Artificial Intelligence & Machine Learning',
        designation: randomItem(designations),
        experienceYears: randomInt(2, 25),
        address: randomItem(addresses),
        profilePhotoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
        userId: user.id
      }
    });
    facultyList.push(faculty);
  }

  // 4. Map Faculty to Subjects
  console.log('Linking Faculty to Subjects...');
  for (const subject of subjects) {
    const numSections = randomInt(1, 2);
    const sections = ['A', 'B'].slice(0, numSections);

    for (const section of sections) {
      const faculty = randomItem(facultyList);
      await prisma.facultySubject.create({
        data: {
          facultyId: faculty.id,
          subjectId: subject.id,
          section
        }
      });
    }
  }

  // 5. Generate Students (240 students, 30 per semester)
  console.log('Generating 240 Students across 8 semesters...');
  const currentYear = new Date().getFullYear();
  const students = [];

  for (let sem = 1; sem <= 8; sem++) {
    const admissionYear = currentYear - Math.floor((sem - 1) / 2);
    
    for (let i = 1; i <= 30; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const fullName = `${firstName} ${lastName}`;
      const email = `student.${firstName.toLowerCase()}.${sem}.${i}@intellicampus.com`;
      const usn = `1AB${String(admissionYear).slice(-2)}CS${String((sem * 100) + i).padStart(3, '0')}`;
      
      const user = await prisma.user.create({
        data: {
          email,
          password: 'hashed_password_placeholder',
          role: Role.STUDENT,
          isRegistered: true,
        }
      });

      const student = await prisma.student.create({
        data: {
          usn,
          registrationNumber: usn,
          fullName,
          email,
          gender: randomItem(genders),
          dateOfBirth: new Date(admissionYear - 19, randomInt(0, 11), randomInt(1, 28)),
          branch: 'Artificial Intelligence & Machine Learning',
          semester: sem,
          section: randomItem(['A', 'B']),
          phone: `+91 ${randomInt(6000, 9999)}${randomInt(100000, 999999)}`,
          address: randomItem(addresses),
          bloodGroup: randomItem(bloodGroups),
          profilePhotoUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firstName}`,
          
          fatherName: `${randomItem(firstNames)} ${lastName}`,
          fatherPhone: `+91 ${randomInt(9000, 9999)}${randomInt(100000, 999999)}`,
          fatherEmail: `father.${firstName.toLowerCase()}@example.com`,
          motherName: `${randomItem(firstNames)} ${lastName}`,
          motherPhone: `+91 ${randomInt(8000, 8999)}${randomInt(100000, 999999)}`,
          motherEmail: `mother.${firstName.toLowerCase()}@example.com`,
          
          admissionYear,
          overallGpa: randomFloat(6.0, 9.8),
          userId: user.id
        }
      });
      students.push(student);
    }
  }

  // 6. Attendance & Marks
  console.log('Generating Attendance & Evaluation records...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60);

  const subjectsBySemester = {};
  for (const s of subjects) {
    if (!subjectsBySemester[s.semester]) subjectsBySemester[s.semester] = [];
    subjectsBySemester[s.semester].push(s);
  }

  for (const student of students) {
    const studentSubjects = subjectsBySemester[student.semester] || [];
    
    for (const subject of studentSubjects) {
      // Find faculty for this section
      const facultySub = await prisma.facultySubject.findFirst({
        where: { subjectId: subject.id, section: student.section }
      });
      const facultyId = facultySub ? facultySub.facultyId : facultyList[0].id;

      // Attendance
      const attendanceData = [];
      let presentCount = 0;
      let totalEffectiveDays = 0;

      for (let d = 0; d < 60; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        if (date.getDay() === 0) continue; // Skip Sunday

        totalEffectiveDays++;
        const isPresent = Math.random() < randomFloat(0.70, 0.95);
        if (isPresent) presentCount++;

        attendanceData.push({
          studentId: student.id,
          subjectId: subject.id,
          date,
          status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT
        });
      }
      await prisma.attendance.createMany({ data: attendanceData });

      // Marks
      const marksData = [
        { testType: 'IA-1', max: 25 },
        { testType: 'IA-2', max: 25 },
        { testType: 'Assignment', max: 10 },
        { testType: 'Quiz', max: 10 }
      ].map(t => ({
        studentId: student.id,
        subjectId: subject.id,
        testType: t.testType,
        marks: randomFloat(t.max * 0.4, t.max),
        maxMarks: t.max,
        grade: 'A' // simplified
      }));
      await prisma.marks.createMany({ data: marksData });
    }
    
    // Update student percentage
    const allAtt = await prisma.attendance.findMany({ where: { studentId: student.id } });
    const perc = allAtt.length > 0 ? (allAtt.filter(a => a.status === 'PRESENT').length / allAtt.length) * 100 : 0;
    await prisma.student.update({
      where: { id: student.id },
      data: { overallAttendancePercentage: perc }
    });
  }

  console.log('--- Seed Finished ---');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
