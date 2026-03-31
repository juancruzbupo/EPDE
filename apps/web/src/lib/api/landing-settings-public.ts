import type { LandingConsequenceExample, LandingFaqItem, LandingPricing } from '@epde/shared';

/**
 * Fetches landing settings from the API (public endpoint, no auth needed).
 * Called from server components with ISR revalidation.
 * Falls back to null on error (landing page uses hardcoded defaults).
 */
export async function fetchLandingSettings(): Promise<{
  pricing?: LandingPricing;
  faq?: LandingFaqItem[];
  consequences?: LandingConsequenceExample[];
} | null> {
  try {
    const apiUrl = process.env.API_PROXY_TARGET || 'http://localhost:3001';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000); // 5s timeout prevents build hang
    const res = await fetch(`${apiUrl}/api/v1/landing-settings`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
