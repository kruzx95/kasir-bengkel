import { prisma } from './src/lib/prisma';
async function main() {
  const txs = await prisma.transaction.findMany({ include: { customer: true } });
  console.log(txs.map(t => ({ id: t.id, invoice: t.invoiceNumber, status: t.status, corporateId: t.customer?.corporateCustomerId })));
}
main();
