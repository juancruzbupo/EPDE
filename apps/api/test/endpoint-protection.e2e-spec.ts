import { METHOD_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, INestApplication, Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { createTestApp } from '../src/test/setup';

/**
 * Structural test that verifies every route handler in the app has either
 * @Roles() or @Public() decorator. Catches accidental unprotected endpoints
 * that would silently return 403 via the deny-by-default RolesGuard.
 */
describe('Endpoint Protection (structural)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('every route handler should have @Roles() or @Public() decorator', () => {
    const discoveryService = app.get(DiscoveryService);
    const reflector = app.get(Reflector);

    const controllers = discoveryService.getControllers();
    const unprotected: string[] = [];

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter((m) => {
        if (m === 'constructor') return false;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, m);
        // Skip getters/setters — only check regular methods
        return descriptor && typeof descriptor.value === 'function';
      });

      for (const methodName of methodNames) {
        const handler = prototype[methodName];

        // Only check actual route handlers (methods with HTTP method metadata)
        const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler);
        if (httpMethod === undefined) continue;

        const roles = reflector.getAllAndOverride(ROLES_KEY, [handler, metatype]);
        const isPublic = reflector.getAllAndOverride(IS_PUBLIC_KEY, [handler, metatype]);

        if (!roles && !isPublic) {
          unprotected.push(`${metatype.name}.${methodName}`);
        }
      }
    }

    expect(unprotected).toEqual([]);
  });
});
