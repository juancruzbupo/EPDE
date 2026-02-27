import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './clients.repository';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [EmailModule, AuthModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository, PrismaService],
  exports: [ClientsService],
})
export class ClientsModule {}
