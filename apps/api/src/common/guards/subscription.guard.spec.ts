/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from '@epde/shared';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SubscriptionGuard } from './subscription.guard';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SubscriptionGuard(reflector);
  });

  function mockContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => (user ? { user } : {}),
      }),
    } as unknown as ExecutionContext;
  }

  function mockPublic(isPublic: boolean) {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      return undefined;
    }) as any);
  }

  it('should allow @Public() endpoints', () => {
    mockPublic(true);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow when no user on request (defers to JwtAuthGuard)', () => {
    mockPublic(false);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow ADMIN regardless of subscription', () => {
    mockPublic(false);
    expect(
      guard.canActivate(
        mockContext({
          role: UserRole.ADMIN,
          subscriptionExpiresAt: new Date('2020-01-01').toISOString(),
        }),
      ),
    ).toBe(true);
  });

  it('should allow CLIENT without subscriptionExpiresAt (grandfathered)', () => {
    mockPublic(false);
    expect(
      guard.canActivate(mockContext({ role: UserRole.CLIENT, subscriptionExpiresAt: null })),
    ).toBe(true);
  });

  it('should allow CLIENT with active subscription', () => {
    mockPublic(false);
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(
      guard.canActivate(
        mockContext({ role: UserRole.CLIENT, subscriptionExpiresAt: future.toISOString() }),
      ),
    ).toBe(true);
  });

  it('should throw 402 for CLIENT with expired subscription', () => {
    mockPublic(false);
    const past = new Date('2024-01-01');
    expect(() =>
      guard.canActivate(
        mockContext({ role: UserRole.CLIENT, subscriptionExpiresAt: past.toISOString() }),
      ),
    ).toThrow(HttpException);

    try {
      guard.canActivate(
        mockContext({ role: UserRole.CLIENT, subscriptionExpiresAt: past.toISOString() }),
      );
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
    }
  });

  it('should allow CLIENT with subscriptionExpiresAt undefined (grandfathered)', () => {
    mockPublic(false);
    expect(
      guard.canActivate(mockContext({ role: UserRole.CLIENT, subscriptionExpiresAt: undefined })),
    ).toBe(true);
  });
});
