import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const departments = [
    { name: 'Artificial Intelligence and Machine Learning', code: 'AIML' },
    { name: 'Computer Science Engineering', code: 'CSE' },
    { name: 'Electronics and Communication', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
    { name: 'Civil Engineering', code: 'CIVIL' },
    { name: 'Cyber Security and Forensics', code: 'CSF' }
];

const firstNames = ['Aarav', 'Aditi', 'Arjun', 'Ananya', 'Ishaan', 'Kavya', 'Vihaan', 'Saanvi', 'Rohan', 'Zoya', 'Aditya', 'Riya', 'Aryan', 'Mysha', 'Kabir', 'Kiara', 'Vivaan', 'Pari', 'Dev', 'Tanya'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Singh', 'Reddy', 'Patel', 'Iyer', 'Nair', 'Deshmukh', 'Choudhury', 'Joshi', 'Bose', 'Rao', 'Kulkarni', 'Mehta', 'Kaur', 'Grewal', 'Dutta'];
const cities = ['Bangalore', 'Mangalore', 'Mysore', 'Hubli', 'Dharwad', 'Belgaum', 'Udupi', 'Shimoga'];

const generateIndianPhone = () => {
    const starts = ['6', '7', '8', '9'];
    let phone = starts[Math.floor(Math.random() * starts.length)];
    for (let i = 0; i < 9; i++) {
        phone += Math.floor(Math.random() * 10).toString();
    }
    return phone;
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedDatabase = async () => {
    try {
        await connectDB();
        
        console.log('Cleaning existing student data...');
        // We only clear students, leave admins/faculty if they exist
        await User.deleteMany({ role: 'student' });

        const students = [];

        // 1. ADD SPECIAL ENTRY: Aparna Rajesh
        students.push({
            name: "Aparna Rajesh",
            usn: "AIML01S6_001",
            email: "aparnarajeshapzz@gmail.com",
            department: "Artificial Intelligence and Machine Learning",
            semester: 6,
            phoneNumber: "9876543210",
            parentName: "Rajesh Kumar",
            parentPhone: "9123456780",
            parentEmail: "rajeshparent@gmail.com",
            dateOfBirth: new Date("2003-05-14"),
            address: "Mangalore, Karnataka",
            isActive: true,
            password: null,
            isVerified: false,
            role: 'student'
        });

        console.log('Generating 4320 students...');

        for (const dept of departments) {
            for (let sem = 1; sem <= 8; sem++) {
                // Generate 90 students per semester
                for (let i = 1; i <= 90; i++) {
                    const usn = `${dept.code}01S${sem}_${i.toString().padStart(3, '0')}`;
                    
                    // Skip if it's the special USN we already added
                    if (usn === "AIML01S6_001") continue;

                    const firstName = getRandom(firstNames);
                    const lastName = getRandom(lastNames);
                    const name = `${firstName} ${lastName}`;
                    const email = `${usn.toLowerCase()}@intellicampus.edu`;

                    // Age calculation: 18 + sem - 1
                    const birthYear = 2007 - (sem - 1); // Approx birth year
                    const birthDate = new Date(`${birthYear}-01-01`);
                    birthDate.setMonth(Math.floor(Math.random() * 12));
                    birthDate.setDate(Math.floor(Math.random() * 28) + 1);

                    students.push({
                        name,
                        usn,
                        email,
                        department: dept.name,
                        semester: sem,
                        phoneNumber: generateIndianPhone(),
                        parentName: `${getRandom(firstNames)} ${lastName}`,
                        parentPhone: generateIndianPhone(),
                        parentEmail: `${firstName.toLowerCase()}.parent@gmail.com`,
                        dateOfBirth: birthDate,
                        address: `${getRandom(cities)}, Karnataka`,
                        isActive: Math.random() > 0.1, // 90% true
                        password: null,
                        isVerified: false,
                        role: 'student'
                    });
                }
            }
            console.log(`Generated data for ${dept.code}`);
        }

        console.log(`Inserting ${students.length} students into MongoDB...`);
        
        // Use insertMany for efficiency, but maybe in chunks if it's too large
        const CHUNK_SIZE = 500;
        for (let i = 0; i < students.length; i += CHUNK_SIZE) {
            const chunk = students.slice(i, i + CHUNK_SIZE);
            await User.insertMany(chunk);
            console.log(`Progress: ${i + chunk.length}/${students.length}`);
        }

        console.log('Database Scale-Up Successful!');
        process.exit();
    } catch (error) {
        console.error('Scale-Up Error:', error);
        process.exit(1);
    }
};

seedDatabase();
