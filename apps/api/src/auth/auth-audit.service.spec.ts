import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthAuditService } from './auth-audit.service';

const mockPrisma = {
  authAuditLog: { create: jest.fn().mockResolvedValue({}) },
};

describe('AuthAuditService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;

  beforeEach(async () => {
    mockPrisma.authAuditLog.create.mockReset().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AuthAuditService>(AuthAuditService);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log login event with userId, email, clientType and ip', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    service.logLogin('user-1', 'test@test.com', 'web', '127.0.0.1');

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'login', userId: 'user-1', email: 'test@test.com' }),
    );
  });

  it('should log logout event with userId and jti', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    service.logLogout('user-1', 'jti-123');

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'logout', userId: 'user-1', jti: 'jti-123' }),
    );
  });

  it('should warn on failed login with email, reason and ip', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    service.logFailedLogin('test@test.com', 'wrong_password', '127.0.0.1');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'login_failed', email: 'test@test.com' }),
    );
  });

  it('should warn on token reuse with family and userId', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    service.logTokenReuse('family-abc', 'user-1');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'token_reuse_attack',
        family: 'family-abc',
        userId: 'user-1',
      }),
    );
  });

  it('should call prisma.authAuditLog.create fire-and-forget (returns void, not a Promise)', () => {
    const result = service.logLogin('user-1', 'test@test.com', 'web', '127.0.0.1');

    expect(result).toBeUndefined();
    expect(mockPrisma.authAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event: 'login', userId: 'user-1' }),
      }),
    );
  });

  it('should not propagate prisma errors — audit failure must never block auth', async () => {
    mockPrisma.authAuditLog.create.mockRejectedValue(new Error('DB down'));
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    expect(() => service.logLogin('user-1', 'test@test.com', 'web', '127.0.0.1')).not.toThrow();

    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to persist auth audit'));
  });
});
