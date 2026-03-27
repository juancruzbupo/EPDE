import { UserRole } from '@epde/shared';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Checks that CLIENT users have an active subscription (subscriptionExpiresAt > now).
 * ADMIN users bypass this check. Public endpoints bypass this check.
 * Returns 402 Payment Required when subscription has expired.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return true; // JwtAuthGuard handles missing user

    // Admins bypass subscription check
    if (user.role === UserRole.ADMIN) return true;

    // Clients without subscriptionExpiresAt are grandfathered (pre-feature users)
    if (!user.subscriptionExpiresAt) return true;

    if (new Date(user.subscriptionExpiresAt) < new Date()) {
      throw new HttpException(
        {
          statusCode: 402,
          message: 'Tu suscripción ha expirado. Contactá al administrador para renovarla.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
