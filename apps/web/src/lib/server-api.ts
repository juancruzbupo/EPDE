import { cookies } from 'next/headers';

// Server-side fetches go directly to the API (server-to-server, no proxy needed)
const API_BASE = process.env.API_PROXY_TARGET
  ? `${process.env.API_PROXY_TARGET}/api/v1`
  : 'http://localhost:3001/api/v1';

/**
 * Server-side fetch that forwards auth cookies to the API.
 * Returns parsed JSON or null if the request fails.
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
