import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/set-password',
  '/forgot-password',
  '/reset-password',
  '/subscription-expired',
];

/**
 * Routes that only ADMIN can access. CLIENT tokens hitting these prefixes
 * are redirected to `/` (home) before any HTML is returned.
 *
 * Source of truth for authorization stays on the API (@Roles decorator);
 * this is a UX/defense-in-depth layer that prevents shipping an admin shell
 * to a client browser where it would 403 on every API call anyway.
 */
const ADMIN_ONLY_PREFIXES = ['/clients', '/categories', '/landing-settings', '/templates'];

interface JwtPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

function parseToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8')) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or unparseable.
 * 30s buffer avoids edge-case redirects right before expiry.
 */
function isExpired(payload: JwtPayload | null): boolean {
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = parseToken(accessToken);
  if (isExpired(payload)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // CLIENT tokens are blocked from admin-only prefixes.
  // ADMIN is allowed everywhere (no whitelist needed).
  if (
    payload?.role === 'CLIENT' &&
    ADMIN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
