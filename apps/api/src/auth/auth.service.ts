import { BCRYPT_SALT_ROUNDS, SUBSCRIPTION_INITIAL_DAYS, UserStatus } from '@epde/shared';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserAlreadyHasPasswordError } from '../common/exceptions/domain.exceptions';
import { EmailQueueService } from '../email/email-queue.service';
import { UsersService } from '../users/users.service';
import { AuthAuditService } from './auth-audit.service';
import { LoginAttemptService } from './login-attempt.service';
import { TokenService } from './token.service';

interface LoginMeta {
  clientType?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly authAudit: AuthAuditService,
    private readonly emailQueueService: EmailQueueService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}

  async validateUser(email: string, password: string) {
    // Account lockout: block before bcrypt.compare to save CPU on brute-force
    if (await this.loginAttemptService.isLocked(email)) {
      throw new HttpException(
        'Demasiados intentos fallidos. Intentá de nuevo en 15 minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      await this.loginAttemptService.recordFailure(email);
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await this.loginAttemptService.recordFailure(email);
      return null;
    }
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }
    // Successful auth — reset counter
    await this.loginAttemptService.clear(email);
    return user;
  }

  async login(
    user: { id: string; email: string; role: string; subscriptionExpiresAt?: Date | string | null },
    meta?: LoginMeta,
  ) {
    const subExp = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair({
      ...user,
      subscriptionExpiresAt: subExp,
    });

    // Track last login timestamp (fire-and-forget — don't block login on failure)
    void this.usersService
      .update(user.id, { lastLoginAt: new Date() })
      .catch((err) => this.logger.warn(`Failed to update lastLoginAt for ${user.id}: ${err}`));

    const fullUser = await this.usersService.findById(user.id);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = fullUser;

    this.authAudit.logLogin(user.id, user.email, meta?.clientType ?? 'web', meta?.ip ?? 'unknown');

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async logout(userId: string, jti?: string, family?: string, ttlSeconds?: number) {
    // Both blacklist + revoke should complete OR both should surface an error.
    // Partial failure (blacklist ok, revoke throws) would leave the refresh family
    // valid while the client assumes they've logged out. Collect errors, log,
    // return success to the client either way — they already intend to log out,
    // and we've done what we could. The logged warning gives ops a signal.
    const errors: Array<{ op: string; err: unknown }> = [];
    if (jti && ttlSeconds) {
      await this.tokenService.blacklistAccessToken(jti, ttlSeconds).catch((err) => {
        errors.push({ op: 'blacklistAccessToken', err });
      });
    }
    if (family) {
      await this.tokenService.revokeFamily(family).catch((err) => {
        errors.push({ op: 'revokeFamily', err });
      });
    }
    if (errors.length > 0) {
      this.logger.warn(
        `Logout partial failure for user ${userId}: ${errors
          .map((e) => `${e.op}=${(e.err as Error).message}`)
          .join(', ')}`,
      );
    }
    this.authAudit.logLogout(userId, jti ?? 'unknown');
  }

  async setPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'invite') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findById(payload.sub);

      if (user.status !== UserStatus.INVITED) {
        throw new UserAlreadyHasPasswordError();
      }

      const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + SUBSCRIPTION_INITIAL_DAYS * 24 * 60 * 60_000);

      await this.usersService.update(user.id, {
        passwordHash: hash,
        status: UserStatus.ACTIVE,
        activatedAt: now,
        subscriptionExpiresAt: expiresAt,
      });

      this.authAudit.logPasswordSet(user.id);

      return { message: 'Contraseña configurada correctamente' };
    } catch (error) {
      if (error instanceof UserAlreadyHasPasswordError) {
        throw new BadRequestException(error.message);
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Always return success even if user not found (prevents email enumeration)
    if (!user || !user.passwordHash) return;

    // Embed first 8 chars of passwordHash as fingerprint — makes token
    // implicitly single-use: once password changes, fingerprint won't match.
    const fp = user.passwordHash.slice(0, 8);
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'reset', fp },
      { expiresIn: '1h' },
    );

    // Fire-and-forget — queue email (catch prevents silent failure)
    void this.emailQueueService
      .enqueuePasswordReset(user.email, user.name, token)
      .catch((err) => this.logger.error('Failed to enqueue password reset email', err));
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'reset') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Token inválido');

      // Verify fingerprint — ensures token is single-use (password hasn't changed since token was issued)
      if (payload.fp && user.passwordHash?.slice(0, 8) !== payload.fp) {
        throw new UnauthorizedException('Token ya utilizado');
      }

      const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await this.usersService.update(user.id, { passwordHash: hash });

      this.authAudit.logPasswordSet(user.id);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user?.passwordHash) {
      throw new BadRequestException('Usuario sin contraseña configurada');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }
    const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(userId, { passwordHash: hash });
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
