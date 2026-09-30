import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding FieldFix database (multi-role: Customer / Technician / Admin)…\n');

  // ===== 1. Admin Users =====
  const adminPw = await bcrypt.hash('admin123', 10);
  for (const email of ['admin@fieldfix.io', 'admin@fieldfix.com']) {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: adminPw, role: 'ADMIN' },
      create: { name: 'Alex Danvers', email, phone: '9999999999', passwordHash: adminPw, role: 'ADMIN' },
    });
    console.log(`✅ Admin: ${email}  /  admin123`);
  }

  // ===== 2. Customer Users =====
  const custPw = await bcrypt.hash('customer123', 10);
  const customers = [
    { name: 'Shrutika Kadu',    email: 'customer@fieldfix.io',  phone: '8888888801' },
    { name: 'Sarah Jenkins',    email: 'customer@fieldfix.com', phone: '8888888802' },
    { name: 'Marcus Sterling',  email: 'marcus@fieldfix.io',    phone: '7777777701' },
    { name: 'Priya Sharma',     email: 'priya@fieldfix.io',     phone: '7777777702' },
  ];
  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: custPw, role: 'CUSTOMER' },
    });
    console.log(`✅ Customer: ${c.email}  /  customer123`);
  }

  // ===== 3. Service Categories =====
  const categories = [
    { name: 'AC & Cooling',      description: 'AC repair, servicing, deep clean & gas recharge',   icon: '❄️',  basePrice: 599 },
    { name: 'Electrical',        description: 'Wiring, MCB, short circuit, fan & light fixing',    icon: '⚡',  basePrice: 449 },
    { name: 'Plumbing',          description: 'Leaks, clogs, drainage, pipe & geyser repair',      icon: '🔧',  basePrice: 399 },
    { name: 'Appliances',        description: 'Washing machine, fridge, microwave & dishwasher',   icon: '🔩',  basePrice: 349 },
    { name: 'Cleaning',          description: 'Deep home cleaning, sofa, carpet & bathroom clean', icon: '✨',  basePrice: 499 },
    { name: 'Carpentry',         description: 'Furniture assembly, door & window repairs',         icon: '🔨',  basePrice: 549 },
    { name: 'Painting',          description: 'Interior & exterior painting, waterproofing',       icon: '🎨',  basePrice: 1499 },
    { name: 'Pest Control',      description: 'Cockroach, bed bug, rodent & termite treatment',    icon: '🐛',  basePrice: 899 },
    { name: 'Smart Home',        description: 'CCTV, smart locks, doorbell & automation',          icon: '🏠',  basePrice: 999 },
    { name: 'Geyser & Water',    description: 'Geyser, water heater, RO & pump repair',           icon: '🚿',  basePrice: 449 },
  ];
  for (const cat of categories) {
    await prisma.serviceCategory.upsert({ where: { name: cat.name }, update: {}, create: cat });
  }
  console.log(`\n✅ ${categories.length} service categories seeded`);

  // ===== 4. Technician Users (with Verified IDs) =====
  const techPw = await bcrypt.hash('tech123', 10);

  const technicians = [
    {
      name: 'Tech Specialist (Pro)',
      email: 'tech@fieldfix.com',
      phone: '9876599999',
      verifiedId: 'TECH-KA-2026-9999',
      skills: ['AC & Cooling', 'Electrical', 'Appliances'],
      specialization: 'Master Repair Technician',
      bio: 'Licensed multi-category field specialist. Certified in electrical wiring, HVAC, and smart home systems.',
      city: 'Bangalore',
      experienceYears: 8,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechPro&backgroundColor=b6e3f4',
      rating: 4.95,
      totalJobs: 420,
      lat: 12.9716,
      lng: 77.5946,
    },
    {
      name: 'David Miller',
      email: 'david@fieldfix.io',
      phone: '9876543210',
      verifiedId: 'TECH-KA-2021-0041',
      skills: ['AC & Cooling', 'Appliances'],
      specialization: 'AC & Cooling Expert',
      bio: '12+ years in HVAC systems. Certified Samsung & LG technician. Quick diagnosis and lasting repairs.',
      city: 'Bangalore',
      experienceYears: 12,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=b6e3f4',
      rating: 4.9,
      totalJobs: 312,
      lat: 12.9791,
      lng: 77.5913,
    },
    {
      name: 'Elena Rostova',
      email: 'elena@fieldfix.io',
      phone: '9876543211',
      verifiedId: 'TECH-KA-2019-0017',
      skills: ['Electrical', 'Smart Home'],
      specialization: 'Electrical & Smart Home',
      bio: 'Licensed electrical engineer. Expert in smart home automation, EV charger installation and complex wiring.',
      city: 'Bangalore',
      experienceYears: 9,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=ffdfbf',
      rating: 4.8,
      totalJobs: 215,
      lat: 12.9352,
      lng: 77.6245,
    },
    {
      name: 'Marcus Vance',
      email: 'mvance@fieldfix.io',
      phone: '9876543212',
      verifiedId: 'TECH-KA-2020-0089',
      skills: ['Plumbing', 'Geyser & Water'],
      specialization: 'Plumbing Specialist',
      bio: 'Master plumber with acoustic leak detection tools. No-damage wall diagnostics. 24/7 emergency available.',
      city: 'Bangalore',
      experienceYears: 7,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
      rating: 4.7,
      totalJobs: 178,
      lat: 12.9165,
      lng: 77.6101,
    },
    {
      name: 'Riya Desai',
      email: 'riya@fieldfix.io',
      phone: '9876543213',
      verifiedId: 'TECH-MH-2022-0034',
      skills: ['Cleaning', 'Pest Control'],
      specialization: 'Deep Cleaning Expert',
      bio: 'Trained in steam cleaning, eco-friendly chemicals. Specializes in post-construction & move-in cleans.',
      city: 'Mumbai',
      experienceYears: 5,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya&backgroundColor=d1d4f9',
      rating: 4.8,
      totalJobs: 134,
      lat: 19.0760,
      lng: 72.8777,
    },
    {
      name: 'Arjun Nair',
      email: 'arjun@fieldfix.io',
      phone: '9876543214',
      verifiedId: 'TECH-KA-2018-0005',
      skills: ['Carpentry', 'Painting'],
      specialization: 'Carpentry & Interior Works',
      bio: 'Expert in modular furniture assembly, custom woodwork, wall textures & interior painting.',
      city: 'Bangalore',
      experienceYears: 11,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=b6e3f4',
      rating: 4.6,
      totalJobs: 245,
      lat: 12.9580,
      lng: 77.6370,
    },
    {
      name: 'Priya Mehta',
      email: 'pmehta@fieldfix.io',
      phone: '9876543215',
      verifiedId: 'TECH-DL-2021-0062',
      skills: ['Appliances', 'AC & Cooling'],
      specialization: 'Appliance Repair Specialist',
      bio: 'Certified Whirlpool & Bosch technician. 8 years repairing washing machines, refrigerators and dishwashers.',
      city: 'Delhi NCR',
      experienceYears: 8,
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffdfbf',
      rating: 4.7,
      totalJobs: 198,
      lat: 28.6139,
      lng: 77.2090,
    },
  ];

  for (const t of technicians) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { passwordHash: techPw, role: 'TECHNICIAN' },
      create: {
        name: t.name, email: t.email, phone: t.phone,
        passwordHash: techPw, role: 'TECHNICIAN',
        avatarUrl: t.photoUrl,
      },
    });

    await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {
        technicianVerifiedId: t.verifiedId,
        skills: JSON.stringify(t.skills),
        specialization: t.specialization,
        bio: t.bio,
        city: t.city,
        experienceYears: t.experienceYears,
        photoUrl: t.photoUrl,
        isAvailable: true,
        currentLat: t.lat,
        currentLng: t.lng,
        rating: t.rating,
        totalJobs: t.totalJobs,
      },
      create: {
        userId: user.id,
        technicianVerifiedId: t.verifiedId,
        skills: JSON.stringify(t.skills),
        specialization: t.specialization,
        bio: t.bio,
        city: t.city,
        experienceYears: t.experienceYears,
        photoUrl: t.photoUrl,
        isAvailable: true,
        currentLat: t.lat,
        currentLng: t.lng,
        rating: t.rating,
        totalJobs: t.totalJobs,
      },
    });

    console.log(`✅ Technician: ${t.name}  [${t.verifiedId}]  /  tech123`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('=== Demo Credentials ===');
  console.log('Admin:       admin@fieldfix.io      / admin123');
  console.log('Customer:    customer@fieldfix.io   / customer123');
  console.log('Technician:  david@fieldfix.io      / tech123  (ID: TECH-KA-2021-0041)');
  console.log('Technician:  elena@fieldfix.io      / tech123  (ID: TECH-KA-2019-0017)');
  console.log('Technician:  mvance@fieldfix.io     / tech123  (ID: TECH-KA-2020-0089)');
}

seed()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
