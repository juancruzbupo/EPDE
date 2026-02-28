import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenService } from '../token.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  family?: string;
  exp?: number;
  purpose?: string;
}

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
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.jti) {
      throw new UnauthorizedException('Token inválido: falta JTI');
    }

    if (payload.purpose && payload.purpose !== 'access') {
      throw new UnauthorizedException('Token type invalid');
    }

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
    };
  }
}
