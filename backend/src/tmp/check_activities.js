const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActivitiesByRole() {
    try {
        console.log('--- SummaryActivity ---');
        const summaryStats = await prisma.summaryActivity.groupBy({
            by: ['userId'],
            _count: { id: true },
        });
        for (const stat of summaryStats) {
            const user = await prisma.user.findUnique({ where: { id: stat.userId }, select: { name: true, role: true, isSuper: true } });
            console.log(`User: ${user?.name} (Role: ${user?.role}, Super: ${user?.isSuper}) - Count: ${stat._count.id}`);
        }

        console.log('--- ContainerActivity ---');
        const containerStats = await prisma.containerActivity.groupBy({
            by: ['userId'],
            _count: { id: true },
        });
        for (const stat of containerStats) {
            const user = await prisma.user.findUnique({ where: { id: stat.userId }, select: { name: true, role: true, isSuper: true } });
            console.log(`User: ${user?.name} (Role: ${user?.role}, Super: ${user?.isSuper}) - Count: ${stat._count.id}`);
        }

        console.log('--- BifurcationActivity ---');
        const bifurcationStats = await prisma.bifurcationActivity.groupBy({
            by: ['userId'],
            _count: { id: true },
        });
        for (const stat of bifurcationStats) {
            const user = await prisma.user.findUnique({ where: { id: stat.userId }, select: { name: true, role: true, isSuper: true } });
            console.log(`User: ${user?.name} (Role: ${user?.role}, Super: ${user?.isSuper}) - Count: ${stat._count.id}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkActivitiesByRole();
