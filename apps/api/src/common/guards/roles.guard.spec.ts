/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(user?: { role: string }): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => (user ? { user } : {}),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow @Public() endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    }) as any);

    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should deny when no @Roles() decorator (deny-by-default)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return undefined;
      return undefined;
    }) as any);

    expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(false);
  });

  it('should allow matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    }) as any);

    expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(true);
  });

  it('should deny mismatching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['ADMIN'];
      return undefined;
    }) as any);

    expect(guard.canActivate(mockContext({ role: 'CLIENT' }))).toBe(false);
  });

  it('should deny when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return ['CLIENT'];
      return undefined;
    }) as any);

    expect(guard.canActivate(mockContext())).toBe(false);
  });
});
