import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔍 Inspecting Mongoose records for email: ${email}...`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ CONNECTED TO MONGODB');

  const user = await User.findOne({ email });

  if (user) {
    console.log('✅ MONGOOSE USER RECORD FOUND');
    console.log(`- ID: ${user._id}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- IsActive: ${user.isActive}`);
  } else {
    console.log('❌ NO MONGOOSE USER RECORD FOUND');
  }

  await mongoose.disconnect();
}

main().catch(err => console.error(err));
