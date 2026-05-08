import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clean database...');

  // ─── Wipe everything except preserving existing admin ──────────────────────
  await prisma.session.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availableSlot.deleteMany();
  await prisma.scheduleConfig.deleteMany();

  // Remove test/non-admin users but keep existing admin accounts
  await prisma.user.deleteMany({ where: { role: 'CLIENT' } });

  // ─── Services ─────────────────────────────────────────────────────────────
  await prisma.service.deleteMany();
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Consulta General',
        duration: 30,
        description: 'Consulta general de 30 minutos.',
        price: 50,
        color: '#6366f1',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Consulta Especializada',
        duration: 60,
        description: 'Consulta con especialista, revisión completa.',
        price: 120,
        color: '#8b5cf6',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Seguimiento',
        duration: 20,
        description: 'Seguimiento de tratamiento previo.',
        price: 30,
        color: '#06b6d4',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Urgencias',
        duration: 45,
        description: 'Atención prioritaria para casos urgentes.',
        price: 80,
        color: '#ef4444',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // ─── Admin User ───────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@ragenda.app' } });

  let admin;
  if (existingAdmin) {
    admin = existingAdmin;
    console.log('✅ Admin user already exists, keeping it');
  } else {
    const adminPasswordHash = await bcrypt.hash('Admin@1234!', 12);
    admin = await prisma.user.create({
      data: {
        email: 'admin@ragenda.app',
        passwordHash: adminPasswordHash,
        name: 'Admin RaGenda',
        phone: '+1234567890',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Created admin user');
  }

  // ─── Default Schedule Config ───────────────────────────────────────────────
  await prisma.scheduleConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      workDays: [1, 2, 3, 4, 5],     // Mon–Fri
      startTime: '09:00',
      endTime: '18:00',
      intervalMinutes: 30,
      maxCapacity: 1,
      bookingWindowDays: 60,
      breakStart: '13:00',
      breakEnd: '14:00',
    },
  });

  console.log('✅ Default schedule config created/verified');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Admin credentials:');
  console.log('  Email:    admin@ragenda.app');
  console.log('  Password: Admin@1234!');
  console.log(`\n  Admin ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
