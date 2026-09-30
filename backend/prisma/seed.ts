import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding FieldFix database...\n');

  // ===== 1. Create Admin Users (.io and .com) =====
  const adminPassword = await bcrypt.hash('admin123', 10);
  for (const email of ['admin@fieldfix.io', 'admin@fieldfix.com']) {
    const admin = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: adminPassword, role: 'ADMIN' },
      create: {
        name: 'Alex Danvers (Admin)',
        email,
        phone: '9999999999',
        passwordHash: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin created: ${admin.email} (password: admin123)`);
  }

  // ===== 2. Create Customer Users (.io and .com) =====
  const customerPassword = await bcrypt.hash('customer123', 10);
  for (const email of ['customer@fieldfix.io', 'customer@fieldfix.com']) {
    const customer = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: customerPassword, role: 'CUSTOMER' },
      create: {
        name: 'Sarah Jenkins',
        email,
        phone: '8888888888',
        passwordHash: customerPassword,
        role: 'CUSTOMER',
      },
    });
    console.log(`✅ Customer created: ${customer.email} (password: customer123)`);
  }

  // ===== 3. Create another Customer =====
  const customer2Password = await bcrypt.hash('customer123', 10);
  const customer2 = await prisma.user.upsert({
    where: { email: 'marcus@fieldfix.io' },
    update: {},
    create: {
      name: 'Marcus Sterling',
      email: 'marcus@fieldfix.io',
      phone: '7777777777',
      passwordHash: customer2Password,
      role: 'CUSTOMER',
    },
  });
  console.log(`✅ Customer created: ${customer2.email} (password: customer123)`);

  // ===== 4. Create Service Categories =====
  const categories = [
    { name: 'HVAC & Air Conditioning', description: 'Heating, ventilation, and AC repair & installation', icon: '❄️', basePrice: 1500 },
    { name: 'Electrical Wiring', description: 'Electrical wiring inspection, repair & installation', icon: '⚡', basePrice: 1200 },
    { name: 'Plumbing Services', description: 'Pipe fitting, leak repair & drainage', icon: '🔧', basePrice: 1000 },
    { name: 'Smart Home Installation', description: 'Smart thermostat, security camera & sensor setup', icon: '🏠', basePrice: 2000 },
    { name: 'Appliance Repair', description: 'Washing machine, refrigerator & appliance servicing', icon: '🔩', basePrice: 800 },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} service categories created`);

  // ===== 5. Create Technician Users =====
  const techPassword = await bcrypt.hash('tech123', 10);
  const techData = [
    { name: 'David Miller', email: 'david@fieldfix.io', phone: '6666666666', skills: 'HVAC & Air Conditioning' },
    { name: 'Elena Rostova', email: 'elena@fieldfix.io', phone: '5555555555', skills: 'Electrical Wiring' },
    { name: 'Marcus Vance', email: 'mvance@fieldfix.io', phone: '4444444444', skills: 'Plumbing Services' },
  ];

  for (const tech of techData) {
    const user = await prisma.user.upsert({
      where: { email: tech.email },
      update: {},
      create: {
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        passwordHash: techPassword,
        role: 'TECHNICIAN',
      },
    });

    await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        skills: JSON.stringify([tech.skills]),
        isAvailable: true,
        rating: 4.5 + Math.random() * 0.5,
        totalJobs: Math.floor(Math.random() * 50) + 10,
      },
    });

    console.log(`✅ Technician created: ${tech.name} (${tech.email}, password: tech123)`);
  }

  console.log('\n🎉 Seed complete! Your database is ready.\n');
  console.log('=== Login Credentials ===');
  console.log('Admin:    admin@fieldfix.io    / admin123');
  console.log('Customer: customer@fieldfix.io / customer123');
  console.log('Tech:     david@fieldfix.io    / tech123');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
