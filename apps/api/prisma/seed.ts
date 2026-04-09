import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import type {
  CategoryTemplateSeed,
  TaskTemplateSeed,
} from '../../../packages/shared/src/seed/template-data';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TEMPLATE_SEED_DATA } = require('../../../packages/shared/dist/seed/index.cjs') as {
  TEMPLATE_SEED_DATA: CategoryTemplateSeed[];
};
import { seedDemo } from './seed-demo';

const prisma = new PrismaClient();

const BCRYPT_SALT_ROUNDS = 12;

// Names MUST match CategoryTemplate names in TEMPLATE_SEED_DATA
// so the FK linkage can be established during seeding.
const CATEGORY_DEFAULTS = [
  {
    name: 'Estructura',
    icon: 'building',
    order: 1,
    description: 'Cimientos, vigas, columnas, muros portantes y fundaciones',
  },
  {
    name: 'Techos y Cubiertas',
    icon: 'home',
    order: 2,
    description: 'Membranas, tejas, canaletas, bajadas pluviales y aislación',
  },
  {
    name: 'Instalación Eléctrica',
    icon: 'zap',
    order: 3,
    description: 'Tablero, protecciones, puesta a tierra y cableado',
  },
  {
    name: 'Instalación Sanitaria',
    icon: 'droplets',
    order: 4,
    description: 'Cañerías, griferías, tanque de agua y desagües',
  },
  {
    name: 'Gas y Calefacción',
    icon: 'flame',
    order: 5,
    description: 'Artefactos de gas, ventilación, caldera y oblea NAG-226',
  },
  {
    name: 'Aberturas',
    icon: 'door-open',
    order: 6,
    description: 'Puertas, ventanas, burletes, cerraduras y persianas',
  },
  {
    name: 'Pintura y Revestimientos',
    icon: 'paintbrush',
    order: 7,
    description: 'Pintura interior y exterior, revoques y cerámicos',
  },
  {
    name: 'Jardín y Exteriores',
    icon: 'trees',
    order: 8,
    description: 'Veredas, medianeras, poda, pileta y riego',
  },
  {
    name: 'Climatización',
    icon: 'thermometer',
    order: 9,
    description: 'Aire acondicionado, ventilación y aislación térmica',
  },
  {
    name: 'Humedad e Impermeabilización',
    icon: 'droplet',
    order: 10,
    description: 'Humedad ascendente, filtraciones, drenaje y condensación',
  },
  {
    name: 'Seguridad contra Incendio',
    icon: 'fire-extinguisher',
    order: 11,
    description: 'Detectores de humo, matafuegos y vías de evacuación',
  },
  {
    name: 'Control de Plagas',
    icon: 'bug',
    order: 12,
    description: 'Desinsectación, desratización, termitas y mosquitos',
  },
  {
    name: 'Pisos y Contrapisos',
    icon: 'layers',
    order: 13,
    description: 'Baldosas, juntas, nivelación, madera y piedra',
  },
];

// Rename categories from old names to match template names (for existing DBs)
const CATEGORY_RENAMES: Record<string, string> = {
  Electricidad: 'Instalación Eléctrica',
  Plomería: 'Instalación Sanitaria',
  Pintura: 'Pintura y Revestimientos',
  Estructural: 'Estructura',
};

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

  // Rename old categories to match CategoryTemplate names (idempotent)
  for (const [oldName, newName] of Object.entries(CATEGORY_RENAMES)) {
    const old = await prisma.category.findFirst({
      where: { name: oldName, deletedAt: null },
    });
    if (old) {
      await prisma.category.update({
        where: { id: old.id },
        data: { name: newName },
      });
      console.log(`  Renamed category: "${oldName}" → "${newName}"`);
    }
  }

  // Soft-delete legacy categories that no longer have templates
  for (const legacyName of ['Seguridad', 'Limpieza General']) {
    const legacy = await prisma.category.findFirst({
      where: { name: legacyName, deletedAt: null },
    });
    if (legacy) {
      const taskCount = await prisma.task.count({
        where: { categoryId: legacy.id, deletedAt: null },
      });
      if (taskCount === 0) {
        await prisma.category.update({
          where: { id: legacy.id },
          data: { deletedAt: new Date() },
        });
        console.log(`  Soft-deleted unused category: "${legacyName}"`);
      } else {
        console.log(`  Kept "${legacyName}" (has ${taskCount} active tasks)`);
      }
    }
  }

  // Create/update default categories
  for (const cat of CATEGORY_DEFAULTS) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, deletedAt: null },
    });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, order: cat.order, description: cat.description },
      });
    } else {
      await prisma.category.create({ data: cat });
    }
  }
  console.log(`${CATEGORY_DEFAULTS.length} categories synced`);

  // Create category + task templates
  const existingTemplates = await prisma.categoryTemplate.count();
  const existingNames = new Set(
    (await prisma.categoryTemplate.findMany({ select: { name: true } })).map((t) => t.name),
  );
  const missingCategories = TEMPLATE_SEED_DATA.filter((c) => !existingNames.has(c.name));

  if (missingCategories.length > 0) {
    for (const category of missingCategories) {
      const created = await prisma.categoryTemplate.create({
        data: {
          name: category.name,
          icon: category.icon,
          description: category.description,
          displayOrder: category.displayOrder,
          tasks: {
            create: category.tasks.map((task: TaskTemplateSeed, index: number) => ({
              name: task.name,
              taskType: task.taskType as 'INSPECTION',
              professionalRequirement: task.professionalRequirement as 'OWNER_CAN_DO',
              technicalDescription: task.technicalDescription,
              priority: task.priority as 'MEDIUM',
              recurrenceType: task.recurrenceType as 'ANNUAL',
              recurrenceMonths: task.recurrenceMonths,
              estimatedDurationMinutes: task.estimatedDurationMinutes,
              defaultSector: task.defaultSector as 'EXTERIOR',
              inspectionGuide: task.inspectionGuide,
              displayOrder: index,
            })),
          },
        },
        include: { tasks: true },
      });
      console.log(`  ${category.icon} ${created.name} (${created.tasks.length} tareas)`);
    }
    console.log(`${missingCategories.length} new category templates created`);
  } else {
    console.log(`All ${existingTemplates} category templates up to date`);
  }

  // Sync defaultSector + inspectionGuide on existing task templates (idempotent)
  for (const category of TEMPLATE_SEED_DATA) {
    for (const task of category.tasks) {
      await prisma.taskTemplate.updateMany({
        where: { name: task.name, defaultSector: null },
        data: { defaultSector: task.defaultSector as 'EXTERIOR' },
      });
      if (task.inspectionGuide) {
        await prisma.taskTemplate.updateMany({
          where: { name: task.name, inspectionGuide: null },
          data: { inspectionGuide: task.inspectionGuide },
        });
      }
    }
  }

  // Link categories to their matching templates via FK
  const allTemplates = await prisma.categoryTemplate.findMany({ select: { id: true, name: true } });
  const templatesByName = new Map(allTemplates.map((t) => [t.name, t.id]));
  for (const cat of CATEGORY_DEFAULTS) {
    const templateId = templatesByName.get(cat.name);
    if (templateId) {
      await prisma.category.updateMany({
        where: { name: cat.name, deletedAt: null, categoryTemplateId: null },
        data: { categoryTemplateId: templateId },
      });
    }
  }
  console.log('Category → CategoryTemplate FK linkage synced');

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
