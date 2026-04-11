import type { JwtPayload as SharedJwtPayload } from '@epde/shared';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { TokenService } from '../token.service';

interface JwtPayload extends SharedJwtPayload {
  purpose?: string;
}

/**
 * JWT Passport strategy for access token validation on every protected request.
 *
 * **Redis dependency (soft):** The `validate` method checks the token's JTI against the
 * Redis blacklist via `TokenService.isBlacklisted`. If Redis is unavailable,
 * `isBlacklisted` degrades gracefully and returns `false` (allow through) rather than
 * throwing, so requests are not blocked during Redis downtime.
 * Trade-off: revoked tokens may work until Redis recovers — availability over perfect security.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback for Swagger/Postman
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.jti) {
      throw new UnauthorizedException('Token inválido: falta JTI');
    }

    if (payload.purpose && payload.purpose !== 'access') {
      throw new UnauthorizedException('Token type invalid');
    }

    // isBlacklisted() uses safeExists() which returns false on Redis failure
    // (graceful degradation). This catch is a fail-closed safety net: if an
    // unexpected error ever propagates, reject the request rather than allow
    // a potentially revoked token through.
    try {
      const blacklisted = await this.tokenService.isBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException('Token revocado');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Blacklist lookup failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Error al validar token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
      family: payload.family,
      exp: payload.exp,
      subscriptionExpiresAt: payload.subExp ?? null,
    };
  }
}
