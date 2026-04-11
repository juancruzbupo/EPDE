import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Throttler variant that keys rate-limit buckets by `ip + email` instead of IP alone.
 *
 * **Why:** The default `ThrottlerGuard` trackea by IP. An attacker with a botnet or
 * rotating proxies can distribute brute-force attempts across many IPs, each staying
 * under the per-IP limit. By adding the email (lowercased, trimmed) to the tracker key,
 * the limit applies *per victim account*, not per attacker source.
 *
 * **Where to use:** `login`, `forgot-password`, `reset-password` — any endpoint where
 * the request body contains an email and the attacker wants to target a specific user.
 *
 * **Fallback:** If the request has no email (malformed body), the tracker degrades to IP
 * only, so the guard stays effective against scraping attacks without a body.
 */
@Injectable()
export class EmailAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const ip = req.ip ?? 'unknown';
    const rawEmail = (req.body as { email?: unknown })?.email;
    if (typeof rawEmail !== 'string' || rawEmail.length === 0) {
      return ip;
    }
    const email = rawEmail.toLowerCase().trim();
    return `${ip}:${email}`;
  }
}
