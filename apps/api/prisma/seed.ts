import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TEMPLATE_SEED_DATA } from '@epde/shared';
import { seedDemo } from './seed-demo';

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
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('WARNING: Using default admin password. Set SEED_ADMIN_PASSWORD in production.');
  }
  const passwordHash = await bcrypt.hash(seedPassword, BCRYPT_SALT_ROUNDS);

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

  // Create category + task templates
  const existingTemplates = await prisma.categoryTemplate.count();
  if (existingTemplates === 0) {
    for (const category of TEMPLATE_SEED_DATA) {
      const created = await prisma.categoryTemplate.create({
        data: {
          name: category.name,
          icon: category.icon,
          description: category.description,
          displayOrder: category.displayOrder,
          tasks: {
            create: category.tasks.map((task, index) => ({
              name: task.name,
              taskType: task.taskType as 'INSPECTION',
              professionalRequirement: task.professionalRequirement as 'OWNER_CAN_DO',
              technicalDescription: task.technicalDescription,
              priority: task.priority as 'MEDIUM',
              recurrenceType: task.recurrenceType as 'ANNUAL',
              recurrenceMonths: task.recurrenceMonths,
              estimatedDurationMinutes: task.estimatedDurationMinutes,
              displayOrder: index,
            })),
          },
        },
        include: { tasks: true },
      });
      console.log(`  ${category.icon} ${created.name} (${created.tasks.length} tareas)`);
    }
    console.log(`${TEMPLATE_SEED_DATA.length} category templates created`);
  } else {
    console.log(`Category templates already exist (${existingTemplates}), skipping`);
  }

  // Create demo data (3 users with properties, tasks, logs, budgets, etc.)
  const existingDemoUser = await prisma.user.findUnique({
    where: { email: 'maria.gonzalez@demo.com' },
  });
  if (!existingDemoUser) {
    await seedDemo(prisma);
  } else {
    console.log('Demo data already exists, skipping');
  }

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
