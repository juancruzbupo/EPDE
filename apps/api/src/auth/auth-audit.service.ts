import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * AuthAuditService — Justified direct PrismaService usage.
 *
 * This service directly injects PrismaService instead of going through a
 * repository, because audit logging is fire-and-forget infrastructure that
 * does not participate in business transactions. The ESLint exemption is
 * configured in eslint.config.mjs.
 */
@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger('AuthAudit');

  constructor(private readonly prisma: PrismaService) {}

  logLogin(userId: string, email: string, clientType: string, ip: string) {
    this.logger.log({ event: 'login', userId, email, clientType, ip });
    this.persist({ event: 'login', userId, email, ip, clientType });
  }

  logLogout(userId: string, jti: string) {
    this.logger.log({ event: 'logout', userId, jti });
    this.persist({ event: 'logout', userId, metadata: { jti } });
  }

  logFailedLogin(email: string, reason: string, ip: string) {
    this.logger.warn({ event: 'login_failed', email, reason, ip });
    this.persist({ event: 'login_failed', email, ip, metadata: { reason } });
  }

  logPasswordSet(userId: string) {
    this.logger.log({ event: 'password_set', userId });
    this.persist({ event: 'password_set', userId });
  }

  logTokenReuse(family: string, userId: string) {
    this.logger.warn({ event: 'token_reuse_attack', family, userId });
    this.persist({ event: 'token_reuse_attack', userId, metadata: { family } });
  }

  private persist(data: {
    event: string;
    userId?: string;
    email?: string;
    ip?: string;
    clientType?: string;
    metadata?: Record<string, unknown>;
  }): void {
    // Fire-and-forget: audit failure must never block auth flows
    void this.prisma.authAuditLog
      .create({ data: data as Prisma.AuthAuditLogUncheckedCreateInput })
      .catch((err: Error) => {
        this.logger.error(`Failed to persist auth audit: ${err.message}`);
      });
  }
}
