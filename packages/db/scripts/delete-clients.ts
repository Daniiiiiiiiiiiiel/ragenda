import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting client deletion...');
  
  const result = await prisma.user.deleteMany({
    where: {
      role: 'CLIENT',
    },
  });

  console.log(`Deleted ${result.count} clients and all their associated data (sessions, appointments).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
