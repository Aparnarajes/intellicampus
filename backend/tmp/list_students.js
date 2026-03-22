import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const students = await User.find({ role: /student/i });
  
  console.log(`🔍 Found ${students.length} students in Mongoose...`);
  students.forEach(s => {
    console.log(`- Email: "${s.email}" | Role: ${s.role} | Active: ${s.isActive}`);
  });
  
  await mongoose.disconnect();
}

main().catch(err => console.error(err));
