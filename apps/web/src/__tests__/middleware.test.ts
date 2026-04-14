import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { middleware } from '../middleware';

// Mock NextResponse
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({ type: 'next' })),
      redirect: vi.fn((url: URL) => ({ type: 'redirect', url })),
    },
  };
});

function createRequest(pathname: string, accessToken?: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000');
  const req = new NextRequest(url);
  if (accessToken) {
    req.cookies.set('access_token', accessToken);
  }
  return req;
}

/** Build a fake JWT with the given payload (no signature verification in middleware). */
function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-signature`;
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access to / without token', () => {
    const req = createRequest('/');
    middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('allows access to /login without token', () => {
    const req = createRequest('/login');
    middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('redirects to /login when no access_token cookie exists', () => {
    const req = createRequest('/properties');
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('redirects to /login when token is expired', () => {
    const expired = fakeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const req = createRequest('/properties', expired);
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' }),
    );
  });

  it('allows access when token is valid and not expired', () => {
    const valid = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const req = createRequest('/properties', valid);
    middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  describe('role-based routing', () => {
    const validExp = Math.floor(Date.now() / 1000) + 3600;

    it('redirects CLIENT away from /clients to /', () => {
      const token = fakeJwt({ exp: validExp, role: 'CLIENT', sub: 'u1' });
      const req = createRequest('/clients', token);
      middleware(req);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/' }),
      );
    });

    it('redirects CLIENT away from /landing-settings to /', () => {
      const token = fakeJwt({ exp: validExp, role: 'CLIENT', sub: 'u1' });
      const req = createRequest('/landing-settings', token);
      middleware(req);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/' }),
      );
    });

    it('redirects CLIENT away from /templates/foo to /', () => {
      const token = fakeJwt({ exp: validExp, role: 'CLIENT', sub: 'u1' });
      const req = createRequest('/templates/foo', token);
      middleware(req);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/' }),
      );
    });

    it('allows ADMIN on /clients', () => {
      const token = fakeJwt({ exp: validExp, role: 'ADMIN', sub: 'u1' });
      const req = createRequest('/clients', token);
      middleware(req);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows CLIENT on /properties (not admin-only)', () => {
      const token = fakeJwt({ exp: validExp, role: 'CLIENT', sub: 'u1' });
      const req = createRequest('/properties', token);
      middleware(req);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});
