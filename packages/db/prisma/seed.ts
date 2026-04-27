import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean existing data ──────────────────────────────────────────────────
  await prisma.session.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availableSlot.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  // ─── Services ─────────────────────────────────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Consulta General',
        duration: 30,
        description: 'Consulta médica general de 30 minutos.',
        price: 50,
        color: '#6366f1',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Consulta Especializada',
        duration: 60,
        description: 'Consulta con especialista, incluye revisión completa.',
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
  const adminPasswordHash = await bcrypt.hash('Admin@1234!', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ragenda.app',
      passwordHash: adminPasswordHash,
      name: 'Admin RaGenda',
      phone: '+1234567890',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // ─── Client Users ─────────────────────────────────────────────────────────
  const clientPasswordHash = await bcrypt.hash('Client@1234!', 12);
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        email: 'maria@example.com',
        passwordHash: clientPasswordHash,
        name: 'María García',
        phone: '+1234567891',
        role: 'CLIENT',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'carlos@example.com',
        passwordHash: clientPasswordHash,
        name: 'Carlos López',
        phone: '+1234567892',
        role: 'CLIENT',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ana@example.com',
        passwordHash: clientPasswordHash,
        name: 'Ana Martínez',
        phone: '+1234567893',
        role: 'CLIENT',
        emailVerified: false,
      },
    }),
  ]);

  console.log(`✅ Created 1 admin + ${clients.length} client users`);

  // ─── Available Slots (next 30 days, Mon–Sat, 09:00–18:00) ────────────────
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const businessHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  for (let d = 1; d <= 45; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0) continue; // Skip Sundays

    for (const time of businessHours) {
      // Saturday: only morning slots
      if (dayOfWeek === 6 && !time.startsWith('09') && !time.startsWith('10') && !time.startsWith('11') && !time.startsWith('12')) {
        continue;
      }
      slots.push({ date, time, maxCapacity: 2, currentBookings: 0, isBlocked: false });
    }
  }

  await prisma.availableSlot.createMany({ data: slots });
  console.log(`✅ Created ${slots.length} available slots`);

  // ─── Sample Appointments ──────────────────────────────────────────────────
  const futureDate1 = new Date(today);
  futureDate1.setDate(today.getDate() + 3);
  const futureDate2 = new Date(today);
  futureDate2.setDate(today.getDate() + 7);

  await Promise.all([
    prisma.appointment.create({
      data: {
        userId: clients[0].id,
        serviceId: services[0].id,
        date: futureDate1,
        timeSlot: '09:00',
        status: 'PENDING',
        notes: 'Primera consulta general.',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: clients[0].id,
        serviceId: services[1].id,
        date: futureDate2,
        timeSlot: '14:00',
        status: 'ACCEPTED',
        notes: 'Necesito revisión especializada.',
        adminNotes: 'Confirmado. Traer estudios previos.',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: clients[1].id,
        serviceId: services[2].id,
        date: futureDate1,
        timeSlot: '10:00',
        status: 'REJECTED',
        notes: 'Seguimiento de tratamiento.',
        adminNotes: 'Agenda llena. Por favor reagenda.',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: clients[2].id,
        serviceId: services[3].id,
        date: futureDate2,
        timeSlot: '16:00',
        status: 'CANCELLED',
        notes: 'Urgencia.',
      },
    }),
  ]);

  console.log('✅ Created 4 sample appointments');
  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin: admin@ragenda.app / Admin@1234!');
  console.log('  Client: maria@example.com / Client@1234!');
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
