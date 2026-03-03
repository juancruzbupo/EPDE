import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthAuditService } from './auth-audit.service';

describe('AuthAuditService', () => {
  let service: AuthAuditService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAuditService],
    }).compile();

    service = module.get<AuthAuditService>(AuthAuditService);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log login event with userId, email, clientType and ip', () => {
    service.logLogin('user-1', 'test@test.com', 'web', '127.0.0.1');

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'login', userId: 'user-1', email: 'test@test.com' }),
    );
  });

  it('should log logout event with userId and jti', () => {
    service.logLogout('user-1', 'jti-123');

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'logout', userId: 'user-1', jti: 'jti-123' }),
    );
  });

  it('should warn on failed login with email, reason and ip', () => {
    service.logFailedLogin('test@test.com', 'wrong_password', '127.0.0.1');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'login_failed', email: 'test@test.com' }),
    );
  });

  it('should warn on token reuse with family and userId', () => {
    service.logTokenReuse('family-abc', 'user-1');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'token_reuse_attack', family: 'family-abc', userId: 'user-1' }),
    );
  });
});
