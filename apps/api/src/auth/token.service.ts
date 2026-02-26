import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AccessPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
}

interface RefreshPayload extends AccessPayload {
  family: string;
  generation: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Generate a new token pair. Creates a new token family on login.
   */
  async generateTokenPair(user: { id: string; email: string; role: string }): Promise<TokenPair> {
    const family = randomUUID();
    const generation = 0;

    const accessToken = this.createAccessToken(user, family);
    const refreshToken = this.createRefreshToken(user, family, generation);

    // Store family state in Redis (TTL = refresh token lifetime)
    const refreshTtl = this.getRefreshTtlSeconds();
    await this.redisService.setex(
      `rt:${family}`,
      refreshTtl,
      JSON.stringify({ userId: user.id, generation }),
    );

    return { accessToken, refreshToken };
  }

  /**
   * Rotate refresh token. Validates generation and increments it.
   * Detects token reuse attacks by checking generation mismatch.
   */
  async rotateRefreshToken(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Token de refresco inválido');
    }

    const { sub, email, role, family, generation } = payload;

    // Check family state in Redis
    const familyData = await this.redisService.get(`rt:${family}`);
    if (!familyData) {
      throw new UnauthorizedException('Sesión expirada');
    }

    const stored = JSON.parse(familyData) as { userId: string; generation: number };

    // Token reuse attack detection
    if (stored.generation !== generation) {
      this.logger.warn(`Token reuse attack detected for user ${sub}, family ${family}`);
      await this.revokeFamily(family);
      throw new UnauthorizedException('Token reutilizado — sesión revocada');
    }

    // Rotate: increment generation
    const newGeneration = generation + 1;
    const user = { id: sub, email, role };

    const accessToken = this.createAccessToken(user, family);
    const newRefreshToken = this.createRefreshToken(user, family, newGeneration);

    // Update family state
    const refreshTtl = this.getRefreshTtlSeconds();
    await this.redisService.setex(
      `rt:${family}`,
      refreshTtl,
      JSON.stringify({ userId: sub, generation: newGeneration }),
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke an entire token family (used on token reuse detection or logout).
   */
  async revokeFamily(family: string): Promise<void> {
    await this.redisService.del(`rt:${family}`);
  }

  /**
   * Blacklist an access token JTI until it expires.
   */
  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.redisService.setex(`bl:${jti}`, ttlSeconds, '1');
  }

  /**
   * Check if an access token JTI is blacklisted.
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    return this.redisService.exists(`bl:${jti}`);
  }

  private createAccessToken(
    user: { id: string; email: string; role: string },
    family: string,
  ): string {
    const jti = randomUUID();
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti, family },
      { expiresIn: this.configService.get('JWT_EXPIRATION', '15m') },
    );
  }

  private createRefreshToken(
    user: { id: string; email: string; role: string },
    family: string,
    generation: number,
  ): string {
    const jti = randomUUID();
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, jti, family, generation },
      { expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d') },
    );
  }

  private getRefreshTtlSeconds(): number {
    const expiration = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
    // Parse simple duration strings like '7d', '24h', '60m'
    const match = expiration.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 3600; // default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 'd':
        return value * 24 * 3600;
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 7 * 24 * 3600;
    }
  }
}
