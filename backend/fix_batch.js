import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updateBatches = async () => {
    const res1 = await prisma.student.updateMany({
        where: { usn: { contains: '23' } },
        data: { batch: '2023-2027' }
    });
    console.log('Updated 2023 batch:', res1.count);

    const res2 = await prisma.student.updateMany({
        where: { usn: { contains: '24' } },
        data: { batch: '2024-2028' }
    });
    console.log('Updated 2024 batch:', res2.count);

    const res3 = await prisma.student.updateMany({
        where: { batch: null }, // fallbacks
        data: { batch: '2023-2027' }
    });
    console.log('Updated fallbacks:', res3.count);
};

updateBatches().catch(console.error).finally(async () => {
    await prisma.$disconnect()
});
