import { UserRole } from '@epde/shared';
import { Reflector } from '@nestjs/core';

import { Roles, ROLES_KEY } from './roles.decorator';

describe('@Roles decorator', () => {
  it('exports ROLES_KEY as a stable string literal', () => {
    // RolesGuard reads metadata by this exact key — changing it breaks auth.
    expect(ROLES_KEY).toBe('roles');
  });

  it('sets role metadata on the decorated method', () => {
    // Invoke the decorator directly (avoids needing decorator syntax in specs).
    class TestController {
      adminOnly() {}
    }
    Roles(UserRole.ADMIN)(TestController.prototype, 'adminOnly', {
      value: TestController.prototype.adminOnly,
    });

    const reflector = new Reflector();
    const metadata = reflector.get<UserRole[]>(ROLES_KEY, TestController.prototype.adminOnly);
    expect(metadata).toEqual([UserRole.ADMIN]);
  });

  it('supports multiple roles', () => {
    class TestController {
      bothRoles() {}
    }
    Roles(UserRole.ADMIN, UserRole.CLIENT)(TestController.prototype, 'bothRoles', {
      value: TestController.prototype.bothRoles,
    });

    const reflector = new Reflector();
    const metadata = reflector.get<UserRole[]>(ROLES_KEY, TestController.prototype.bothRoles);
    expect(metadata).toEqual([UserRole.ADMIN, UserRole.CLIENT]);
  });

  it('produces empty array when called with no roles', () => {
    class TestController {
      noRoles() {}
    }
    Roles()(TestController.prototype, 'noRoles', {
      value: TestController.prototype.noRoles,
    });

    const reflector = new Reflector();
    const metadata = reflector.get<UserRole[]>(ROLES_KEY, TestController.prototype.noRoles);
    expect(metadata).toEqual([]);
  });
});
