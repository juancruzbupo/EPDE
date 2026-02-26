import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(cookieParser());

  await app.init();
  return app;
}

/**
 * Cleans all tables using TRUNCATE CASCADE to avoid FK race conditions
 * with async event handlers (e.g. notification listeners).
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  const tableNames = [
    'Notification',
    'TaskNote',
    'TaskLog',
    'Task',
    'MaintenancePlan',
    'ServiceRequestPhoto',
    'ServiceRequest',
    'BudgetLineItem',
    'BudgetResponse',
    'BudgetRequest',
    'Property',
    'Category',
    'User',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableNames.join('", "')}" CASCADE`);
}
