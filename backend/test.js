import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.student.findMany()
  .then(sts => {
      const uniqueBatches = new Set();
      const uniqueSections = new Set();
      sts.forEach(s => {
          uniqueBatches.add(s.batch || 'NULL');
          uniqueSections.add(s.section || 'NULL');
      });
      console.log('uniqueBatches:', Array.from(uniqueBatches));
      console.log('uniqueSections:', Array.from(uniqueSections));
      
      const firstFew = sts.slice(0, 3).map(s => ({ usn: s.usn, batch: s.batch, section: s.section, branch: s.branch }));
      console.log('firstFew:', firstFew);
  }).then(console.log).finally(() => prisma.$disconnect());
