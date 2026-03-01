import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { AuthAuditService } from './auth-audit.service';

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

  /**
   * Lua script for atomic token rotation.
   * KEYS[1] = rt:{family}
   * ARGV[1] = expected generation
   * ARGV[2] = new generation
   * ARGV[3] = TTL in seconds
   *
   * Returns: 1 = success, 0 = family not found, -1 = generation mismatch (reuse attack)
   */
  private static readonly ROTATE_LUA = `
    local data = redis.call('GET', KEYS[1])
    if not data then return 0 end
    local stored = cjson.decode(data)
    if stored.generation ~= tonumber(ARGV[1]) then return -1 end
    stored.generation = tonumber(ARGV[2])
    redis.call('SETEX', KEYS[1], tonumber(ARGV[3]), cjson.encode(stored))
    return 1
  `;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly authAudit: AuthAuditService,
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
   * Rotate refresh token atomically via Lua script.
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
    const newGeneration = generation + 1;
    const refreshTtl = this.getRefreshTtlSeconds();

    // Atomic check-and-increment via Lua script
    let result: unknown;
    try {
      result = await this.redisService.eval(
        TokenService.ROTATE_LUA,
        [`rt:${family}`],
        [generation, newGeneration, refreshTtl],
      );
    } catch (error) {
      this.logger.error(
        `Redis error during token rotation for user ${sub}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Error al rotar token');
    }

    if (result === 0) {
      throw new UnauthorizedException('Sesión expirada');
    }

    if (result === -1) {
      this.logger.warn(`Token reuse attack detected for user ${sub}, family ${family}`);
      this.authAudit.logTokenReuse(family, sub);
      await this.revokeFamily(family);
      throw new UnauthorizedException('Token reutilizado — sesión revocada');
    }

    const user = { id: sub, email, role };
    const accessToken = this.createAccessToken(user, family);
    const newRefreshToken = this.createRefreshToken(user, family, newGeneration);

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
   * Degrades gracefully if Redis is unavailable: logs warning and allows the request.
   * Trade-off: availability over perfect security during Redis downtime.
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redisService.safeExists(`bl:${jti}`);
    if (result === null) {
      this.logger.warn(`Redis unavailable — skipping blacklist check for JTI ${jti}`);
      return false;
    }
    return result;
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
