import {
  ExecutionContext,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { TokenService } from '../../auth/token.service';
import { StrictBlacklistGuard } from './strict-blacklist.guard';

function createMockContext(user?: { jti?: string }): ExecutionContext {
  const mockReq = { user } as never;
  return {
    switchToHttp: () => ({ getRequest: () => mockReq }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('StrictBlacklistGuard', () => {
  let guard: StrictBlacklistGuard;
  let mockTokenService: { isBlacklistedStrict: jest.Mock };
  let mockReflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    mockTokenService = { isBlacklistedStrict: jest.fn().mockResolvedValue(false) };
    mockReflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    guard = new StrictBlacklistGuard(
      mockTokenService as unknown as TokenService,
      mockReflector as unknown as Reflector,
    );
  });

  it('returns true (no-op) when @StrictAuth metadata is not set', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext({ jti: 'jti-123' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockTokenService.isBlacklistedStrict).not.toHaveBeenCalled();
  });

  it('returns true when JTI is not blacklisted', async () => {
    mockTokenService.isBlacklistedStrict.mockResolvedValue(false);
    const ctx = createMockContext({ jti: 'jti-valid' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockTokenService.isBlacklistedStrict).toHaveBeenCalledWith('jti-valid');
  });

  it('throws UnauthorizedException when JTI is blacklisted', async () => {
    mockTokenService.isBlacklistedStrict.mockResolvedValue(true);
    const ctx = createMockContext({ jti: 'jti-revoked' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('throws ServiceUnavailableException when Redis is unavailable (fail-closed)', async () => {
    mockTokenService.isBlacklistedStrict.mockRejectedValue(
      new ServiceUnavailableException('Auth service temporarily unavailable'),
    );
    const ctx = createMockContext({ jti: 'jti-123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws UnauthorizedException when JTI is missing from req.user', async () => {
    const ctx = createMockContext({ jti: undefined });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockTokenService.isBlacklistedStrict).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when req.user is undefined', async () => {
    const ctx = createMockContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
