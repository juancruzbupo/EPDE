/* eslint-disable @typescript-eslint/no-explicit-any */
import { BCRYPT_SALT_ROUNDS, UserRole, UserStatus } from '@epde/shared';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { EmailQueueService } from '../email/email-queue.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthAuditService } from './auth-audit.service';
import { TokenService } from './token.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: UserRole.CLIENT,
  status: UserStatus.ACTIVE,
  passwordHash: '$2b$12$hashedpassword',
  name: 'Juan Perez',
  phone: '+5491112345678',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const mockInvitedUser = {
  ...mockUser,
  id: 'user-2',
  email: 'invited@example.com',
  status: UserStatus.INVITED,
  passwordHash: null,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokenPair: jest.fn(),
            rotateRefreshToken: jest.fn(),
            revokeFamily: jest.fn(),
            blacklistAccessToken: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
        {
          provide: EmailQueueService,
          useValue: { enqueuePasswordReset: jest.fn() },
        },
        {
          provide: AuthAuditService,
          useValue: {
            logLogin: jest.fn(),
            logLogout: jest.fn(),
            logFailedLogin: jest.fn(),
            logPasswordSet: jest.fn(),
            logTokenReuse: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    tokenService = module.get(TokenService);

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user with correct password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'correctpassword');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', mockUser.passwordHash);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password');

      expect(usersService.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return null with wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('test@example.com', 'wrongpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.passwordHash);
      expect(result).toBeNull();
    });

    it('should return null when user has no passwordHash', async () => {
      usersService.findByEmail.mockResolvedValue(mockInvitedUser as any);

      const result = await authService.validateUser('invited@example.com', 'password');

      expect(usersService.findByEmail).toHaveBeenCalledWith('invited@example.com');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return user, accessToken, refreshToken and strip passwordHash', async () => {
      const loginInput = { id: 'user-1', email: 'test@example.com', role: UserRole.CLIENT };

      tokenService.generateTokenPair.mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await authService.login(loginInput);

      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(loginInput);
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      tokenService.rotateRefreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await authService.refresh('valid-refresh-token');

      expect(tokenService.rotateRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      tokenService.rotateRefreshToken.mockRejectedValue(
        new UnauthorizedException('Token de refresco inválido'),
      );

      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh('invalid-token')).rejects.toThrow(
        'Token de refresco inválido',
      );
    });
  });

  describe('logout', () => {
    it('should blacklist access token and revoke family', async () => {
      tokenService.blacklistAccessToken.mockResolvedValue(undefined);
      tokenService.revokeFamily.mockResolvedValue(undefined);

      await authService.logout('user-1', 'jti-123', 'family-456', 300);

      expect(tokenService.blacklistAccessToken).toHaveBeenCalledWith('jti-123', 300);
      expect(tokenService.revokeFamily).toHaveBeenCalledWith('family-456');
    });

    it('should handle logout without jti or family', async () => {
      await authService.logout('user-1', undefined, undefined, 0);

      expect(tokenService.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokenService.revokeFamily).not.toHaveBeenCalled();
    });
  });

  describe('setPassword', () => {
    it('should set password for INVITED user', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-2', purpose: 'invite' });
      usersService.findById.mockResolvedValue(mockInvitedUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      usersService.update.mockResolvedValue({
        ...mockInvitedUser,
        status: UserStatus.ACTIVE,
        passwordHash: 'new-hashed-password',
      } as any);

      const result = await authService.setPassword('valid-invite-token', 'NewPassword123!');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-invite-token');
      expect(usersService.findById).toHaveBeenCalledWith('user-2');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', BCRYPT_SALT_ROUNDS);
      expect(usersService.update).toHaveBeenCalledWith('user-2', {
        passwordHash: 'new-hashed-password',
        status: UserStatus.ACTIVE,
      });
      expect(result).toEqual({ message: 'Contraseña configurada correctamente' });
    });

    it('should throw BadRequestException if user is not INVITED', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'invite' });
      usersService.findById.mockResolvedValue(mockUser as any);

      await expect(authService.setPassword('valid-token', 'NewPassword123!')).rejects.toThrow(
        BadRequestException,
      );
      await expect(authService.setPassword('valid-token', 'NewPassword123!')).rejects.toThrow(
        'El usuario ya tiene contraseña configurada',
      );
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(authService.setPassword('invalid-token', 'NewPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.setPassword('invalid-token', 'NewPassword123!')).rejects.toThrow(
        'Token inválido o expirado',
      );
    });
  });

  describe('getMe', () => {
    it('should return user without passwordHash', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await authService.getMe('user-1');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Juan Perez');
      expect(result.role).toBe('CLIENT');
    });
  });

  describe('forgotPassword', () => {
    let emailQueueService: jest.Mocked<EmailQueueService>;

    beforeEach(() => {
      emailQueueService = (authService as any).emailQueueService;
    });

    it('should find user, sign reset token, and enqueue password reset email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('signed-reset-token');

      await authService.forgotPassword('test@example.com');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          email: 'test@example.com',
          purpose: 'reset',
          fp: '$2b$12$h',
        },
        { expiresIn: '1h' },
      );
      expect(emailQueueService.enqueuePasswordReset).toHaveBeenCalledWith(
        'test@example.com',
        'Juan Perez',
        'signed-reset-token',
      );
    });

    it('should return silently when user not found (anti-enumeration)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should return silently when user has no passwordHash', async () => {
      usersService.findByEmail.mockResolvedValue(mockInvitedUser as any);

      await expect(authService.forgotPassword('invited@example.com')).resolves.toBeUndefined();

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should verify token, check purpose, update password, and return message', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        purpose: 'reset',
        fp: '$2b$12$h',
      });
      usersService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      usersService.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      } as any);

      const result = await authService.resetPassword('valid-reset-token', 'NewPassword123!');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-reset-token');
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', BCRYPT_SALT_ROUNDS);
      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hashed-password',
      });
      expect(result).toEqual({ message: 'Contraseña actualizada correctamente' });
    });

    it('should reject token with invalid purpose', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        purpose: 'invite',
      });

      await expect(authService.resetPassword('invite-token', 'NewPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject when fingerprint does not match (single-use)', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        purpose: 'reset',
        fp: 'OLD_HASH',
      });
      usersService.findById.mockResolvedValue(mockUser as any);

      await expect(
        authService.resetPassword('used-reset-token', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with expired token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.resetPassword('expired-token', 'NewPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('should verify current password, hash new password, and update user', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      usersService.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hashed-password',
      } as any);

      await authService.changePassword('user-1', 'OldPassword123!', 'NewPassword456!');

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123!', mockUser.passwordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456!', BCRYPT_SALT_ROUNDS);
      expect(usersService.update).toHaveBeenCalledWith('user-1', {
        passwordHash: 'new-hashed-password',
      });
    });

    it('should reject wrong current password', async () => {
      usersService.findById.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', 'WrongPassword!', 'NewPassword456!'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        authService.changePassword('user-1', 'WrongPassword!', 'NewPassword456!'),
      ).rejects.toThrow('Contraseña actual incorrecta');
    });

    it('should reject when user has no passwordHash', async () => {
      usersService.findById.mockResolvedValue(mockInvitedUser as any);

      await expect(
        authService.changePassword('user-2', 'anything', 'NewPassword456!'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        authService.changePassword('user-2', 'anything', 'NewPassword456!'),
      ).rejects.toThrow('Usuario sin contraseña configurada');
    });
  });
});
