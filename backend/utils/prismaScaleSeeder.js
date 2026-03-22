import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const departments = [
    { name: 'Artificial Intelligence and Machine Learning', code: 'AIML' },
    { name: 'Computer Science Engineering', code: 'CSE' },
    { name: 'Electronics and Communication', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
    { name: 'Civil Engineering', code: 'CIVIL' },
    { name: 'Cyber Security and Forensics', code: 'CSF' }
];

const indianFirstNames = [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Siddharth', 'Ishaan', 'Rohan', 'Pranav', 'Karan', 'Aryan',
    'Ananya', 'Diya', 'Ishani', 'Myra', 'Saanvi', 'Anika', 'Aadhya', 'Kiara', 'Ishita', 'Avni',
    'Rahul', 'Sanjay', 'Amit', 'Priya', 'Sneha', 'Deepak', 'Manish', 'Neha', 'R Pooja', 'Karthik'
];

const indianLastNames = [
    'Sharma', 'Verma', 'Gupta', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Singh', 'Deshmukh', 'Kulkarni',
    'Choudhury', 'Banerjee', 'Chatterjee', 'Mehta', 'Joshi', 'Rao', 'Bhat', 'Shetty', 'Menon', 'Gowda'
];

async function seedPrisma() {
    console.log('🚀 Starting Large Scale Prisma Seeding (Institutional Registry)...');
    
    let totalInserted = 0;
    const COLLEGE_CODE = '01'; 

    for (const dept of departments) {
        console.log(`Processing Department: ${dept.code}...`);
        
        for (let sem = 1; sem <= 8; sem++) {
            const studentsToInsert = [];
            
            for (let i = 1; i <= 90; i++) {
                const studentNum = i.toString().padStart(3, '0');
                const usn = `${dept.code}${COLLEGE_CODE}S${sem}_${studentNum}`; 
                
                const firstName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
                const lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
                const fullName = `${firstName} ${lastName}`;
                const email = `${usn.toLowerCase()}@intellicampus.edu`;
                
                studentsToInsert.push({
                    usn,
                    fullName,
                    email,
                    branch: dept.name,
                    semester: sem,
                    section: 'A',
                    batch: `Batch ${2024 - Math.floor((sem-1)/2)}`,
                    isRegistered: false,
                    isActive: true,
                    admissionYear: 2024 - Math.floor((sem-1)/2)
                });
            }
            
            // SQLite doesn't support createMany with skipDuplicates efficiently.
            // We use chunked Promise.all for speed while maintaining compatibility.
            console.log(`Inserting ${dept.code} Sem ${sem}...`);
            const chunks = [];
            for (let j = 0; j < studentsToInsert.length; j += 10) {
                chunks.push(studentsToInsert.slice(j, j + 10));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(student => 
                    prisma.preRegisteredStudent.upsert({
                        where: { usn: student.usn },
                        update: {}, // No update needed if exists
                        create: student
                    })
                ));
            }
            totalInserted += studentsToInsert.length;
        }
    }

    // Special Entry: Aparna Rajesh
    try {
        await prisma.preRegisteredStudent.upsert({
            where: { usn: 'AIML01S1_201' },
            create: {
                usn: 'AIML01S1_201',
                fullName: 'Aaradhya (Aparna) Rajesh',
                email: 'arajes01@intellicampus.edu',
                branch: 'Artificial Intelligence and Machine Learning',
                semester: 6,
                section: 'A',
                batch: '2022-2026',
                admissionYear: 2022,
                isRegistered: false,
                isActive: true
            },
            update: {}
        });
        console.log('Special entry: Aparna Rajesh upserted.');
    } catch (err) {
        console.log('Aparna entry failed or already exists.');
    }

    console.log(`✅ Prisma Seeding Completed. Total records inserted: ${totalInserted}`);
    await prisma.$disconnect();
}

seedPrisma().catch(err => {
    console.error('Fatal error during Prisma seeding:', err);
    process.exit(1);
});
