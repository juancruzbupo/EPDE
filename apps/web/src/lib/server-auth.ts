import { cookies } from 'next/headers';
import { decodeJwtPayload } from './jwt';

interface ServerUser {
  id: string;
  email: string;
  role: string;
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
