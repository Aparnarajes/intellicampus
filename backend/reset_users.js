import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      password: '',
      isFirstLogin: true,
      isRegistered: true
    }
  });
  console.log(`Updated ${result.count} users to First-Time Login state.`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
