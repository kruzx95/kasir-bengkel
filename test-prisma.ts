import { prisma } from './src/lib/prisma';
export async function test() {
  const result = await prisma.transactionItem.groupBy({
    by: ['itemName', 'itemType'],
    where: {
      transaction: {
        transactionDate: { gte: new Date() },
      }
    },
    _sum: { quantity: true }
  });
  console.log(result);
}
