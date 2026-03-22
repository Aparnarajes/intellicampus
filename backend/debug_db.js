import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log('Total Users:', users.length);
  console.log('Sample Users:', users.slice(-5).map(u => u.email));
  
  const faculty = await prisma.faculty.findUnique({
     where: { email: 'aparnarajeshapzz@gmail.com' }
  });
  console.log('Aparna Faculty:', faculty ? 'Found' : 'NOT Found');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
