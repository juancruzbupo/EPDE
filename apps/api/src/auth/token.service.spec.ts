import { UserRole } from '@epde/shared';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '../metrics/metrics.service';
import { RedisService } from '../redis/redis.service';
import { AuthAuditService } from './auth-audit.service';
import { TokenService } from './token.service';

const mockRedisService = {
  setex: jest.fn(),
  del: jest.fn(),
  eval: jest.fn(),
  safeExists: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.token.here'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => {
    if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
    if (key === 'JWT_EXPIRATION') return '15m';
    return defaultValue;
  }),
};

const mockAuthAudit = {
  logTokenReuse: jest.fn(),
};

const mockMetricsService = {
  recordTokenRotation: jest.fn(),
};

const TEST_USER = { id: 'user-1', email: 'test@test.com', role: UserRole.CLIENT };

const REFRESH_PAYLOAD = {
  sub: 'user-1',
  email: 'test@test.com',
  role: UserRole.CLIENT,
  jti: 'jti-123',
  family: 'family-abc',
  generation: 0,
};

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: AuthAuditService, useValue: mockAuthAudit },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jest.clearAllMocks();

    mockRedisService.setex.mockResolvedValue('OK');
    mockRedisService.del.mockResolvedValue(1);
    mockRedisService.eval.mockResolvedValue(1);
    mockRedisService.safeExists.mockResolvedValue(false);
    mockJwtService.sign.mockReturnValue('mock.token.here');
  });

  describe('generateTokenPair', () => {
    it('should return accessToken + refreshToken and persist family in Redis', async () => {
      const result = await service.generateTokenPair(TEST_USER);

      expect(result.accessToken).toBe('mock.token.here');
      expect(result.refreshToken).toBe('mock.token.here');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^rt:/),
        7 * 24 * 3600,
        expect.stringContaining('"userId":"user-1"'),
      );
    });

    it('should throw ServiceUnavailableException when Redis setex fails (fail-fast)', async () => {
      mockRedisService.setex.mockRejectedValue(new Error('Redis connection refused'));

      await expect(service.generateTokenPair(TEST_USER)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should return new token pair when Lua returns 1 (success)', async () => {
      mockJwtService.verify.mockReturnValue(REFRESH_PAYLOAD);
      mockRedisService.eval.mockResolvedValue(1);

      const result = await service.rotateRefreshToken('valid-refresh-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockRedisService.eval).toHaveBeenCalledWith(
        expect.any(String),
        ['rt:family-abc'],
        [0, 1, expect.any(Number)],
      );
    });

    it('should throw UnauthorizedException when JWT is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await expect(service.rotateRefreshToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when Lua returns 0 (family not found / expired)', async () => {
      mockJwtService.verify.mockReturnValue(REFRESH_PAYLOAD);
      mockRedisService.eval.mockResolvedValue(0);

      await expect(service.rotateRefreshToken('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke family and throw UnauthorizedException when Lua returns -1 (reuse attack)', async () => {
      mockJwtService.verify.mockReturnValue(REFRESH_PAYLOAD);
      mockRedisService.eval.mockResolvedValue(-1);

      await expect(service.rotateRefreshToken('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthAudit.logTokenReuse).toHaveBeenCalledWith('family-abc', 'user-1');
      expect(mockRedisService.del).toHaveBeenCalledWith('rt:family-abc');
    });

    it('should throw ServiceUnavailableException when Redis is unavailable', async () => {
      mockJwtService.verify.mockReturnValue(REFRESH_PAYLOAD);
      mockRedisService.eval.mockRejectedValue(new Error('Redis unavailable'));

      await expect(service.rotateRefreshToken('valid-refresh-token')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('revokeFamily', () => {
    it('should call del with key rt:{family}', async () => {
      await service.revokeFamily('family-abc');

      expect(mockRedisService.del).toHaveBeenCalledWith('rt:family-abc');
    });
  });

  describe('blacklistAccessToken', () => {
    it('should call setex with key bl:{jti} and correct TTL', async () => {
      await service.blacklistAccessToken('jti-123', 900);

      expect(mockRedisService.setex).toHaveBeenCalledWith('bl:jti-123', 900, '1');
    });
  });

  describe('isBlacklisted', () => {
    it('should return true when JTI exists in blacklist', async () => {
      mockRedisService.safeExists.mockResolvedValue(true);

      const result = await service.isBlacklisted('jti-123');

      expect(result).toBe(true);
      expect(mockRedisService.safeExists).toHaveBeenCalledWith('bl:jti-123');
    });

    it('should return false when JTI is not in blacklist', async () => {
      mockRedisService.safeExists.mockResolvedValue(false);

      expect(await service.isBlacklisted('jti-456')).toBe(false);
    });

    it('should return false (degrade gracefully) when Redis is unavailable', async () => {
      mockRedisService.safeExists.mockResolvedValue(null);

      expect(await service.isBlacklisted('jti-789')).toBe(false);
    });
  });
});
