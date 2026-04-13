import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { CurrentUser } from './current-user.decorator';

/**
 * @CurrentUser is a param decorator built via createParamDecorator.
 * We test the extractor function directly — that's where the logic lives
 * and where a regression would break every authenticated endpoint.
 */
describe('@CurrentUser decorator', () => {
  // Extract the underlying factory function from the decorator metadata.
  function getFactory() {
    class TestController {
      handler(@CurrentUser() _user: unknown) {}
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handler') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown }
    >;
    const entry = Object.values(args)[0]!;
    return entry.factory;
  }

  function mockContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('returns the full user object when no key is passed', () => {
    const factory = getFactory();
    const user = { id: 'abc', role: 'ADMIN', email: 'a@b.com' };
    expect(factory(undefined, mockContext(user))).toEqual(user);
  });

  it('returns a specific user field when a key is passed', () => {
    const factory = getFactory();
    const user = { id: 'abc', role: 'ADMIN', email: 'a@b.com' };
    expect(factory('id', mockContext(user))).toBe('abc');
    expect(factory('role', mockContext(user))).toBe('ADMIN');
  });

  it('returns undefined for unknown key (does not throw)', () => {
    const factory = getFactory();
    const user = { id: 'abc' };
    expect(factory('nonexistent', mockContext(user))).toBeUndefined();
  });

  it('returns undefined when request.user is missing (JwtAuthGuard failure)', () => {
    const factory = getFactory();
    expect(factory(undefined, mockContext(undefined))).toBeUndefined();
    expect(factory('id', mockContext(undefined))).toBeUndefined();
  });
});
