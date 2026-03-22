import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔍 Comparing case sensitivity for ${email}...`);

  await mongoose.connect(process.env.MONGODB_URI);
  const mongoUser = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
  
  if (mongoUser) {
    console.log(`✅ MONGOOSE: "${mongoUser.email}"`);
  }

  const prismaUser = await prisma.user.findFirst({
    where: { 
      email: {
        equals: email
      }
    }
  });

  if (prismaUser) {
    console.log(`✅ PRISMA (strict): "${prismaUser.email}"`);
  } else {
    console.log('❌ PRISMA (strict match failed)');
    
    // Check all users manually
    const allUsers = await prisma.user.findMany({ select: { email: true } });
    const match = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (match) {
        console.log(`💡 SUGGESTION: Found similar record in Prisma as "${match.email}"`);
    } else {
        console.log('❌ NO SIMILAR EMAIL IN PRISMA');
    }
  }

  await mongoose.disconnect();
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
