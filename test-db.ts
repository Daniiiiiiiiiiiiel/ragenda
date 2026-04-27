import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection speed...');
  const start = Date.now();
  
  // First query (Connection established)
  await prisma.$queryRaw`SELECT 1`;
  const t1 = Date.now();
  console.log(`First query (Cold start): ${t1 - start}ms`);

  // Second query (Warm connection)
  await prisma.$queryRaw`SELECT 1`;
  const t2 = Date.now();
  console.log(`Second query (Warm start): ${t2 - t1}ms`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
