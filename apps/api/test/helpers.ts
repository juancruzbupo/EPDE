import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TokenService } from '../src/auth/token.service';

const MOBILE_HEADER = { 'x-client-type': 'mobile' };

/**
 * Generate tokens directly via TokenService (bypasses login throttle).
 */
export async function generateTokens(
  app: INestApplication,
  user: { id: string; email: string; role?: string },
): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenService = app.get(TokenService);
  return tokenService.generateTokenPair({
    id: user.id,
    email: user.email,
    role: user.role ?? 'CLIENT',
  });
}

/** Get only the access token (convenience) */
export async function getToken(
  app: INestApplication,
  user: { id: string; email: string; role?: string },
): Promise<string> {
  const { accessToken } = await generateTokens(app, user);
  return accessToken;
}

/** Login via HTTP (mobile flow). Use only when testing the login flow itself. */
export async function loginAsMobile(app: INestApplication, email: string, password: string) {
  return request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .set(MOBILE_HEADER)
    .send({ email, password });
}
