/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function mockContext(): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  function mockPublic(isPublic: boolean) {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      return undefined;
    }) as any);
  }

  it('should allow @Public() endpoints without checking JWT', () => {
    mockPublic(true);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should delegate to Passport JWT strategy for non-public endpoints', () => {
    mockPublic(false);
    const superSpy = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate');
    superSpy.mockReturnValue(true);

    expect(guard.canActivate(mockContext())).toBe(true);
    expect(superSpy).toHaveBeenCalled();

    superSpy.mockRestore();
  });

  it('should check both handler and class for @Public() metadata', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    guard.canActivate(mockContext());
    expect(spy).toHaveBeenCalledWith(IS_PUBLIC_KEY, expect.any(Array));
    expect(spy.mock.calls[0]![1]).toHaveLength(2);
  });
});
