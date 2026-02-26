import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger('AuthAudit');

  logLogin(userId: string, email: string, clientType: string, ip: string) {
    this.logger.log({ event: 'login', userId, email, clientType, ip });
  }

  logLogout(userId: string, jti: string) {
    this.logger.log({ event: 'logout', userId, jti });
  }

  logFailedLogin(email: string, reason: string, ip: string) {
    this.logger.warn({ event: 'login_failed', email, reason, ip });
  }

  logPasswordSet(userId: string) {
    this.logger.log({ event: 'password_set', userId });
  }

  logTokenReuse(family: string, userId: string) {
    this.logger.warn({ event: 'token_reuse_attack', family, userId });
  }
}
