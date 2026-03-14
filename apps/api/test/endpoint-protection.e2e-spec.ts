import { METHOD_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, INestApplication, Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../src/common/decorators/public.decorator';
import { ROLES_KEY } from '../src/common/decorators/roles.decorator';
import { createTestApp } from '../src/test/setup';

/**
 * Structural test that verifies every route handler in the app has either
 * @Roles() or @Public() decorator. Catches accidental unprotected endpoints
 * that would silently return 403 via the deny-by-default RolesGuard.
 *
 * Reports each unprotected endpoint individually for clear failure messages.
 */
describe('Endpoint Protection (structural)', () => {
  let app: INestApplication;

  interface EndpointInfo {
    controller: string;
    method: string;
    hasProtection: boolean;
  }

  let endpoints: EndpointInfo[];

  beforeAll(async () => {
    app = await createTestApp();

    const discoveryService = app.get(DiscoveryService);
    const reflector = app.get(Reflector);
    const controllers = discoveryService.getControllers();

    endpoints = [];

    for (const wrapper of controllers) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter((m) => {
        if (m === 'constructor') return false;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, m);
        return descriptor && typeof descriptor.value === 'function';
      });

      for (const methodName of methodNames) {
        const handler = prototype[methodName];

        const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler);
        if (httpMethod === undefined) continue;

        const roles = reflector.getAllAndOverride(ROLES_KEY, [handler, metatype]);
        const isPublic = reflector.getAllAndOverride(IS_PUBLIC_KEY, [handler, metatype]);

        endpoints.push({
          controller: metatype.name,
          method: methodName,
          hasProtection: !!(roles || isPublic),
        });
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should discover at least one endpoint', () => {
    expect(endpoints.length).toBeGreaterThan(0);
  });

  it('every route handler should have @Roles() or @Public() decorator', () => {
    const unprotected = endpoints.filter((e) => !e.hasProtection);

    if (unprotected.length > 0) {
      const details = unprotected.map((e) => `  - ${e.controller}.${e.method}`).join('\n');

      fail(`${unprotected.length} endpoint(s) missing @Roles() or @Public():\n${details}`);
    }
  });
});
