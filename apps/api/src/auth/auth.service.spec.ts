import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';
import { BCRYPT_SALT_ROUNDS } from '@epde/shared';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'CLIENT',
  status: 'ACTIVE',
  passwordHash: '$2b$12$hashedpassword',
  name: 'Juan Perez',
  phone: '+5491112345678',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockInvitedUser = {
  ...mockUser,
  id: 'user-2',
  email: 'invited@example.com',
  status: 'INVITED',
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
            update: jest.fn(),
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
      const loginInput = { id: 'user-1', email: 'test@example.com', role: 'CLIENT' };

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

      await authService.logout('jti-123', 'family-456', 300);

      expect(tokenService.blacklistAccessToken).toHaveBeenCalledWith('jti-123', 300);
      expect(tokenService.revokeFamily).toHaveBeenCalledWith('family-456');
    });

    it('should handle logout without jti or family', async () => {
      await authService.logout(undefined, undefined, 0);

      expect(tokenService.blacklistAccessToken).not.toHaveBeenCalled();
      expect(tokenService.revokeFamily).not.toHaveBeenCalled();
    });
  });

  describe('setPassword', () => {
    it('should set password for INVITED user', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-2' });
      usersService.findById.mockResolvedValue(mockInvitedUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      usersService.update.mockResolvedValue({
        ...mockInvitedUser,
        status: 'ACTIVE',
        passwordHash: 'new-hashed-password',
      } as any);

      const result = await authService.setPassword('valid-invite-token', 'NewPassword123!');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-invite-token');
      expect(usersService.findById).toHaveBeenCalledWith('user-2');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', BCRYPT_SALT_ROUNDS);
      expect(usersService.update).toHaveBeenCalledWith('user-2', {
        passwordHash: 'new-hashed-password',
        status: 'ACTIVE',
      });
      expect(result).toEqual({ message: 'Contraseña configurada correctamente' });
    });

    it('should throw BadRequestException if user is not INVITED', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
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
});
