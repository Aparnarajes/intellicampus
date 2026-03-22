import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'aparnarajeshapzz@gmail.com';
  console.log(`🔍 Checking topic analytics data for ${email}...`);

  const student = await prisma.student.findUnique({
    where: { email }
  });

  if (!student) {
    console.log('❌ Student record not found in Prisma');
    return;
  }

  const topicAnalytics = await prisma.studentTopicAnalytics.findMany({
    where: { studentId: student.id }
  });

  const topicPerformance = await prisma.studentTopicPerformance.findMany({
    where: { studentId: student.id }
  });

  console.log(`✅ Student ID: ${student.id}`);
  console.log(`📊 StudentTopicAnalytics records: ${topicAnalytics.length}`);
  console.log(`📊 StudentTopicPerformance records: ${topicPerformance.length}`);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
