import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { CLIENT_TYPE_HEADER, CLIENT_TYPES, UserRole } from '@epde/shared';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailAwareThrottlerGuard } from '../common/guards/email-aware-throttler.guard';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockRequest(
  overrides: {
    user?: Partial<CurrentUserPayload>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    ip?: string;
  } = {},
) {
  return {
    user: overrides.user ?? {
      id: 'user-1',
      role: UserRole.CLIENT,
      email: 'user@epde.ar',
    },
    headers: overrides.headers ?? {},
    cookies: overrides.cookies ?? {},
    ip: overrides.ip ?? '127.0.0.1',
  };
}

function makeMockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuthService = {
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  setPassword: jest.fn(),
  getMe: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
};

const mockUsersService = {
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'NODE_ENV') return 'test';
    if (key === 'COOKIE_SAME_SITE') return 'strict';
    return undefined;
  }),
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  exp: Math.floor(Date.now() / 1000) + 900,
  subscriptionExpiresAt: null,
  jti: 'jti-abc',
  family: 'family-abc',
};

const loginResult = {
  user: { id: 'client-1', email: 'client@epde.ar', role: UserRole.CLIENT },
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
};

const refreshResult = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(EmailAwareThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'test';
      if (key === 'COOKIE_SAME_SITE') return 'strict';
      return undefined;
    });
  });

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  describe('login', () => {
    it('should call authService.login with the user from req and clientType=web', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({ headers: {} }) as any;
      const res = makeMockResponse() as any;

      await controller.login({} as any, req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(req.user, {
        clientType: 'web',
        ip: '127.0.0.1',
      });
    });

    it('should set access and refresh cookies for web client', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({ headers: {} }) as any;
      const res = makeMockResponse() as any;

      await controller.login({} as any, req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        loginResult.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        loginResult.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should return only user (no tokens) for web client', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({ headers: {} }) as any;
      const res = makeMockResponse() as any;

      const result = await controller.login({} as any, req, res);

      expect(result).toEqual({ data: { user: loginResult.user } });
      expect(result.data).not.toHaveProperty('accessToken');
      expect(result.data).not.toHaveProperty('refreshToken');
    });

    it('should call authService.login with clientType=mobile when x-client-type header is mobile', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
      }) as any;
      const res = makeMockResponse() as any;

      await controller.login({} as any, req, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(req.user, {
        clientType: 'mobile',
        ip: '127.0.0.1',
      });
    });

    it('should return user + tokens for mobile client', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
      }) as any;
      const res = makeMockResponse() as any;

      const result = await controller.login({} as any, req, res);

      expect(result).toEqual({
        data: {
          user: loginResult.user,
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
        },
      });
    });

    it('should still set cookies even for mobile client', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
      }) as any;
      const res = makeMockResponse() as any;

      await controller.login({} as any, req, res);

      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  describe('refresh', () => {
    it('should throw UnauthorizedException if no refresh token found for web client (no cookie)', async () => {
      const req = makeMockRequest({ headers: {}, cookies: {} }) as any;
      const res = makeMockResponse() as any;

      await expect(controller.refresh({} as any, req, res)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });

    it('should read token from cookie for web client and call authService.refresh', async () => {
      mockAuthService.refresh.mockResolvedValue(refreshResult);
      const req = makeMockRequest({
        headers: {},
        cookies: { refresh_token: 'cookie-refresh-token' },
      }) as any;
      const res = makeMockResponse() as any;

      await controller.refresh({} as any, req, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('cookie-refresh-token');
    });

    it('should return message (no tokens) for web client', async () => {
      mockAuthService.refresh.mockResolvedValue(refreshResult);
      const req = makeMockRequest({
        headers: {},
        cookies: { refresh_token: 'cookie-refresh-token' },
      }) as any;
      const res = makeMockResponse() as any;

      const result = await controller.refresh({} as any, req, res);

      expect(result).toEqual({ data: { message: 'Token refrescado' } });
    });

    it('should set new cookies after refresh for web client', async () => {
      mockAuthService.refresh.mockResolvedValue(refreshResult);
      const req = makeMockRequest({
        headers: {},
        cookies: { refresh_token: 'cookie-refresh-token' },
      }) as any;
      const res = makeMockResponse() as any;

      await controller.refresh({} as any, req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        refreshResult.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        refreshResult.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should read token from body for mobile client and call authService.refresh', async () => {
      mockAuthService.refresh.mockResolvedValue(refreshResult);
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
        cookies: {},
      }) as any;
      const res = makeMockResponse() as any;
      const body = { refreshToken: 'mobile-refresh-token' } as any;

      await controller.refresh(body, req, res);

      expect(mockAuthService.refresh).toHaveBeenCalledWith('mobile-refresh-token');
    });

    it('should return tokens in response body for mobile client', async () => {
      mockAuthService.refresh.mockResolvedValue(refreshResult);
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
        cookies: {},
      }) as any;
      const res = makeMockResponse() as any;
      const body = { refreshToken: 'mobile-refresh-token' } as any;

      const result = await controller.refresh(body, req, res);

      expect(result).toEqual({
        data: {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        },
      });
    });

    it('should throw UnauthorizedException if mobile body has no refreshToken', async () => {
      const req = makeMockRequest({
        headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
        cookies: {},
      }) as any;
      const res = makeMockResponse() as any;

      await expect(controller.refresh({} as any, req, res)).rejects.toThrow(UnauthorizedException);
    });
  });

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    it('should call authService.logout with user id, jti, family and computed ttl', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = makeMockResponse() as any;

      await controller.logout(clientUser, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        clientUser.id,
        clientUser.jti,
        clientUser.family,
        expect.any(Number),
      );
    });

    it('should clear access_token cookie', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = makeMockResponse() as any;

      await controller.logout(clientUser, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ path: '/' }),
      );
    });

    it('should clear refresh_token cookie', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = makeMockResponse() as any;

      await controller.logout(clientUser, res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/api/v1/auth' }),
      );
    });

    it('should return session closed message', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = makeMockResponse() as any;

      const result = await controller.logout(clientUser, res);

      expect(result).toEqual({ data: { message: 'Sesión cerrada' } });
    });

    it('should use ttl=0 if user has no exp claim', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const res = makeMockResponse() as any;
      const userWithoutExp: CurrentUserPayload = {
        id: 'u-1',
        role: UserRole.CLIENT,
        email: 'x@x.ar',
        subscriptionExpiresAt: null,
        jti: 'jti-noexp',
      };

      await controller.logout(userWithoutExp, res);

      const [, , , ttl] = mockAuthService.logout.mock.calls[0];
      expect(ttl).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // setPassword
  // -------------------------------------------------------------------------

  describe('setPassword', () => {
    it('should call authService.setPassword with token and newPassword from dto', async () => {
      const dto = { token: 'invite-token-abc', newPassword: 'Segura123!' };
      const serviceResult = { message: 'Contraseña establecida' };
      mockAuthService.setPassword.mockResolvedValue(serviceResult);

      const result = await controller.setPassword(dto as any);

      expect(mockAuthService.setPassword).toHaveBeenCalledWith(dto.token, dto.newPassword);
      expect(result).toEqual({ data: serviceResult });
    });

    it('should propagate the service result inside the data envelope', async () => {
      const dto = { token: 'tok', newPassword: 'Pass123!' };
      const serviceResult = { success: true, userId: 'u-1' };
      mockAuthService.setPassword.mockResolvedValue(serviceResult);

      const result = await controller.setPassword(dto as any);

      expect(result.data).toEqual(serviceResult);
    });
  });

  // -------------------------------------------------------------------------
  // getMe
  // -------------------------------------------------------------------------

  describe('getMe', () => {
    it('should call authService.getMe with the userId and return wrapped data', async () => {
      const userProfile = {
        id: 'client-1',
        email: 'client@epde.ar',
        name: 'Juan Pérez',
        role: UserRole.CLIENT,
      };
      mockAuthService.getMe.mockResolvedValue(userProfile);

      const result = await controller.getMe('client-1');

      expect(mockAuthService.getMe).toHaveBeenCalledWith('client-1');
      expect(result).toEqual({ data: userProfile });
    });

    it('should return whatever the service resolves (no transformation)', async () => {
      const rawServiceResponse = {
        id: 'u-2',
        email: 'admin@epde.ar',
        role: UserRole.ADMIN,
        extra: 'field',
      };
      mockAuthService.getMe.mockResolvedValue(rawServiceResponse);

      const result = await controller.getMe('u-2');

      expect(result.data).toEqual(rawServiceResponse);
    });
  });

  // -------------------------------------------------------------------------
  // forgotPassword
  // -------------------------------------------------------------------------

  describe('forgotPassword', () => {
    it('should delegate to authService.forgotPassword and return anti-enumeration message', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const dto = { email: 'test@epde.ar' } as any;
      const result = await controller.forgotPassword(dto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@epde.ar');
      expect(result).toEqual({
        data: null,
        message:
          'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña',
      });
    });
  });

  // -------------------------------------------------------------------------
  // resetPassword
  // -------------------------------------------------------------------------

  describe('resetPassword', () => {
    it('should delegate to authService.resetPassword and return data envelope', async () => {
      const serviceResult = { message: 'Contraseña actualizada correctamente' };
      mockAuthService.resetPassword.mockResolvedValue(serviceResult);

      const dto = { token: 'reset-token', newPassword: 'NewPass123!' } as any;
      const result = await controller.resetPassword(dto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPass123!');
      expect(result).toEqual({ data: serviceResult });
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------

  describe('updateProfile', () => {
    it('should delegate to usersService.update, strip passwordHash, and return data+message', async () => {
      const updatedUser = {
        id: 'client-1',
        email: 'client@epde.ar',
        name: 'Nuevo Nombre',
        phone: '+5491100000000',
        role: UserRole.CLIENT,
        passwordHash: '$2b$12$secrethash',
      };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const dto = { name: 'Nuevo Nombre', phone: '+5491100000000' } as any;
      const result = await controller.updateProfile(dto, clientUser);

      expect(mockUsersService.update).toHaveBeenCalledWith('client-1', dto);
      expect(result.data).not.toHaveProperty('passwordHash');
      expect(result.data.name).toBe('Nuevo Nombre');
      expect(result.message).toBe('Perfil actualizado');
    });
  });

  // -------------------------------------------------------------------------
  // changePassword
  // -------------------------------------------------------------------------

  describe('changePassword', () => {
    it('should delegate to authService.changePassword and return message', async () => {
      mockAuthService.changePassword.mockResolvedValue(undefined);

      const dto = { currentPassword: 'OldPass123!', newPassword: 'NewPass456!' } as any;
      const result = await controller.changePassword(dto, clientUser);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        'client-1',
        'OldPass123!',
        'NewPass456!',
      );
      expect(result).toEqual({ data: null, message: 'Contraseña actualizada' });
    });
  });
});
