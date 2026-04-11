import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { TokenService } from '../../auth/token.service';
import { STRICT_AUTH_KEY } from '../decorators/strict-auth.decorator';

/**
 * Runs AFTER `JwtAuthGuard` (which populates `req.user` with the JWT payload).
 *
 * Re-checks the access token's JTI against the Redis blacklist using
 * {@link TokenService.isBlacklistedStrict} — fail-closed: if Redis is down,
 * the strict variant throws `ServiceUnavailableException` (HTTP 503) and the
 * request is rejected, instead of the default fail-open behaviour.
 *
 * The guard is a no-op when the endpoint is not marked with `@StrictAuth()`,
 * so it is safe to register globally or compose freely.
 */
@Injectable()
export class StrictBlacklistGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isStrict = this.reflector.getAllAndOverride<boolean>(STRICT_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isStrict) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: { jti?: string } }>();
    const jti = req.user?.jti;
    if (!jti) {
      // JwtAuthGuard should have populated req.user.jti; missing means misconfiguration.
      throw new UnauthorizedException('Token inválido: falta JTI');
    }

    const blacklisted = await this.tokenService.isBlacklistedStrict(jti);
    if (blacklisted) {
      throw new UnauthorizedException('Token revocado');
    }
    return true;
  }
}
