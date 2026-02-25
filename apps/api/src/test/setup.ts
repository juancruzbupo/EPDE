import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

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
 * Cleans all tables in FK-safe order.
 */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.taskNote.deleteMany(),
    prisma.taskLog.deleteMany(),
    prisma.task.deleteMany(),
    prisma.maintenancePlan.deleteMany(),
    prisma.serviceRequestPhoto.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.budgetLineItem.deleteMany(),
    prisma.budgetResponse.deleteMany(),
    prisma.budgetRequest.deleteMany(),
    prisma.property.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
