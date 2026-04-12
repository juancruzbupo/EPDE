import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

/**
 * No-op throttler storage: always reports 0 hits so the APP_GUARD
 * ThrottlerGuard never blocks requests during tests.
 * (.overrideGuard() does NOT work for guards registered via APP_GUARD)
 */
const NoOpThrottlerStorage = {
  increment: async () => ({
    totalHits: 0,
    timeToExpire: 0,
    isBlocked: false,
    timeToBlockExpire: 0,
  }),
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ThrottlerStorage)
    .useValue(NoOpThrottlerStorage)
    .compile();

  const app = moduleRef.createNestApplication();

  // Mirror main.ts: prefix + URI versioning (same mechanism as production)
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.use(cookieParser());

  await app.init();
  return app;
}

/**
 * Cleans all tables using TRUNCATE CASCADE to avoid FK race conditions
 * with async event handlers (e.g. notification listeners).
 *
 * IMPORTANT: When adding new Prisma models with foreign keys,
 * add them here in dependency order (children before parents).
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  const tableNames = [
    'Notification',
    'InspectionItem',
    'InspectionChecklist',
    'TaskNote',
    'TaskAuditLog',
    'TaskLog',
    'Task',
    'MaintenancePlan',
    'ServiceRequestAuditLog',
    'ServiceRequestComment',
    'ServiceRequestAttachment',
    'ServiceRequestPhoto',
    'ServiceRequest',
    'ISVSnapshot',
    'BudgetAuditLog',
    'BudgetComment',
    'BudgetAttachment',
    'BudgetLineItem',
    'BudgetResponse',
    'BudgetRequest',
    'Property',
    'TaskTemplate',
    'CategoryTemplate',
    'Category',
    'UserMilestone',
    'AuthAuditLog',
    'User',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableNames.join('", "')}" CASCADE`);
}
