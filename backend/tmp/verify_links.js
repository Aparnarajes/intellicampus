import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔗 Verifying ID linking for email: ${email}...`);

  const student = await prisma.student.findUnique({
    where: { email },
    include: { user: true }
  });

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (student && user) {
    console.log(`- Prisma Student.userId: ${student.userId}`);
    console.log(`- Prisma User.id: ${user.id}`);
    
    if (student.userId === user.id) {
       console.log('✅ LINKING CONSISTENT');
    } else {
       console.log('❌ LINKING MISMATCH!');
    }
  } else {
    console.log('❌ One or both records missing.');
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
