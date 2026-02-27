import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 12;

const CATEGORY_DEFAULTS = [
  { name: 'Electricidad', icon: 'zap', order: 1 },
  { name: 'Plomería', icon: 'droplets', order: 2 },
  { name: 'Pintura', icon: 'paintbrush', order: 3 },
  { name: 'Techos y Cubiertas', icon: 'home', order: 4 },
  { name: 'Jardín y Exteriores', icon: 'trees', order: 5 },
  { name: 'Climatización', icon: 'thermometer', order: 6 },
  { name: 'Seguridad', icon: 'shield', order: 7 },
  { name: 'Limpieza General', icon: 'sparkles', order: 8 },
  { name: 'Estructural', icon: 'building', order: 9 },
  { name: 'Aberturas', icon: 'door-open', order: 10 },
];

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@epde.com' },
    update: {},
    create: {
      email: 'admin@epde.com',
      name: 'Admin EPDE',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create default categories
  for (const cat of CATEGORY_DEFAULTS) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, deletedAt: null },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, order: cat.order },
      });
    } else {
      await prisma.category.create({ data: cat });
    }
  }
  console.log(`${CATEGORY_DEFAULTS.length} categories created`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
