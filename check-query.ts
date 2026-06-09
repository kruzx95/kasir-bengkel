import { prisma } from './src/lib/prisma';
async function main() {
  const thresholdDate = new Date()
  thresholdDate.setMonth(thresholdDate.getMonth() - 3)
  try {
    const customers = await prisma.customer.findMany({
      where: {
        transactions: { some: {} },
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: thresholdDate } }
        ]
      },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 1,
          include: {
            items: { select: { itemName: true } }
          }
        }
      }
    });
    console.log('Success:', customers.length);
  } catch (err) {
    console.error(err);
  }
}
main();
