import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.student.findMany({ 
    where: { admissionYear: 2023, section: 'A' },
    include: { evaluations: true } 
})
  .then(sts => {
      console.log('Students count:', sts.length);
      if (sts.length > 0) {
          console.log('Sample eval count:', sts[0].evaluations.length);
          console.log('Sample eval total marks:', sts[0].evaluations[0]?.totalMarks);
      }
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
