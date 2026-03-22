import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`Checking user with email: ${email}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { faculty: true }
  });

  if (user) {
    console.log('User found in Prisma:', JSON.stringify(user, null, 2));
  } else {
    console.log('User NOT found in Prisma.');
    
    // Check total count
    const count = await prisma.user.count();
    console.log(`Total User Count in Prisma: ${count}`);

    // Check if she exists via findFirst (maybe case mismatch or something?)
    const userFirst = await prisma.user.findFirst({
      where: { email: { contains: email } }
    });
    if (userFirst) {
      console.log('User found via findFirst:', userFirst.email);
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
