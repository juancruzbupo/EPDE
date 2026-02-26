import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/set-password'];

/**
 * Decode JWT payload (no signature verification — that happens API-side).
 * Returns true if the token is expired or unparseable.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8'));
    if (!payload.exp) return true;
    // Add 30-second buffer to avoid edge-case redirects right before expiry
    return payload.exp * 1000 < Date.now() - 30_000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  if (!accessToken || isTokenExpired(accessToken)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
