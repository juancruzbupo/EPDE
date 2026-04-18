import type { UserRole } from '@epde/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { decodeJwtPayload } from './jwt';
import { ROUTES } from './routes';

export interface ServerUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current user from the access_token cookie (server-side only).
 * Returns null if the cookie is missing or the JWT is invalid.
 */
export async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return { id: payload.sub, email: payload.email, role: payload.role };
}

/**
 * Server-side gate for ADMIN-only route groups. Call from a layout's server
 * component to hard-redirect CLIENT tokens before any admin shell renders.
 *
 * Pairs with the middleware redirect (see apps/web/src/middleware.ts
 * ADMIN_ONLY_PREFIXES): middleware catches the common case at the edge;
 * this layer catches edge-case bypasses (rewrites, direct HTML fetches,
 * stale middleware bundle) with the backend's authoritative answer.
 */
export async function requireAdmin(): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) redirect(ROUTES.login);
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}
