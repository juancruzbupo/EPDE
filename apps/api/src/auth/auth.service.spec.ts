import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
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
  firstName: 'Juan',
  lastName: 'Perez',
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
  let configService: jest.Mocked<ConfigService>;

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
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

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

      configService.get.mockImplementation((key: string, defaultValue: string) => defaultValue);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await authService.login(loginInput);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com', role: 'CLIENT' },
        { expiresIn: '15m' },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', email: 'test@example.com', role: 'CLIENT' },
        { expiresIn: '7d' },
      );
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
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'CLIENT',
      });
      usersService.findById.mockResolvedValue(mockUser as any);
      configService.get.mockImplementation((key: string, defaultValue: string) => defaultValue);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refresh('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh('invalid-token')).rejects.toThrow(
        'Token de refresco inválido',
      );
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
      expect(result.firstName).toBe('Juan');
      expect(result.role).toBe('CLIENT');
    });
  });
});
