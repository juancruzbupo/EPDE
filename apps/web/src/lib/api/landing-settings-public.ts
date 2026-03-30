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
    const res = await fetch(`${apiUrl}/api/v1/landing-settings`, {
      next: { revalidate: 3600 }, // ISR: re-fetch every hour
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
