import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';

/**
 * UsersModule — full CRUD for the User entity.
 *
 * **Scope:** Auth-facing operations (create, update, findById, findByEmail).
 * Password hashing and role assignment happen here via UsersService.
 *
 * **Not to be confused with UserLookupRepository** (`common/repositories/user-lookup.repository.ts`),
 * which is a lightweight, read-only repository used by the scheduler and notifications
 * subsystems to fetch admin IDs or email metadata without pulling in the full UsersModule.
 */
@Module({
  providers: [UsersService, UsersRepository, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
