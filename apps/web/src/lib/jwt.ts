interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Decode a JWT payload without verifying the signature.
 * Signature verification is handled by the backend.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    const json = Buffer.from(payload, 'base64').toString('utf-8');
    const parsed = JSON.parse(json);

    if (!parsed.sub || !parsed.role) return null;
    return { sub: parsed.sub, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}
