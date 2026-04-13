import { UserRole } from '@epde/shared';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TokenService } from '../token.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret-at-least-32-chars-long-xxx';
        return undefined;
      }),
    } as unknown as ConfigService;

    tokenService = {
      isBlacklisted: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    strategy = new JwtStrategy(configService, tokenService);
  });

  function validPayload() {
    return {
      sub: 'user-123',
      email: 'admin@epde.com',
      role: UserRole.ADMIN,
      jti: 'jti-abc',
      family: 'family-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
      subExp: '2026-12-31T00:00:00.000Z',
    };
  }

  describe('validate()', () => {
    it('rejects tokens without a jti', async () => {
      const { jti: _omit, ...payloadNoJti } = validPayload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(strategy.validate(payloadNoJti as any)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects tokens with a non-access purpose (e.g. refresh token used as access)', async () => {
      const payload = { ...validPayload(), purpose: 'refresh' };
      await expect(strategy.validate(payload)).rejects.toThrow('Token type invalid');
    });

    it('accepts tokens with purpose === "access"', async () => {
      tokenService.isBlacklisted.mockResolvedValue(false);
      const payload = { ...validPayload(), purpose: 'access' };
      const result = await strategy.validate(payload);
      expect(result.id).toBe('user-123');
    });

    it('rejects blacklisted tokens', async () => {
      tokenService.isBlacklisted.mockResolvedValue(true);
      await expect(strategy.validate(validPayload())).rejects.toThrow('Token revocado');
    });

    it('fails closed when blacklist lookup throws (unexpected error)', async () => {
      tokenService.isBlacklisted.mockRejectedValue(new Error('Redis timeout'));
      await expect(strategy.validate(validPayload())).rejects.toThrow('Error al validar token');
    });

    it('returns the user payload with subscriptionExpiresAt normalized', async () => {
      tokenService.isBlacklisted.mockResolvedValue(false);
      const payload = validPayload();
      const result = await strategy.validate(payload);
      expect(result).toEqual({
        id: 'user-123',
        email: 'admin@epde.com',
        role: UserRole.ADMIN,
        jti: 'jti-abc',
        family: 'family-1',
        exp: payload.exp,
        subscriptionExpiresAt: '2026-12-31T00:00:00.000Z',
      });
    });

    it('maps missing subExp to null subscriptionExpiresAt', async () => {
      tokenService.isBlacklisted.mockResolvedValue(false);
      const { subExp: _omit, ...payloadNoSub } = validPayload();
      const result = await strategy.validate(payloadNoSub);
      expect(result.subscriptionExpiresAt).toBeNull();
    });
  });
});
