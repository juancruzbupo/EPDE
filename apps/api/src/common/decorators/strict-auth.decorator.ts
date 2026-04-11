import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key consumed by {@link StrictBlacklistGuard}.
 * Endpoints marked with `@StrictAuth()` re-validate the access token's JTI
 * against the Redis blacklist using the fail-closed variant, so a Redis outage
 * returns HTTP 503 instead of silently accepting revoked tokens.
 */
export const STRICT_AUTH_KEY = 'strictAuth';

/**
 * Marks an endpoint as high-impact: requires fail-closed blacklist validation.
 *
 * **When to use:** destructive admin actions, password changes, account deletion,
 * anything where honouring a token revocation matters more than availability.
 *
 * Composes with the default JwtAuthGuard — add this decorator AND `@UseGuards(StrictBlacklistGuard)`
 * (or compose via a shared decorator) on the target controller method.
 */
export const StrictAuth = () => SetMetadata(STRICT_AUTH_KEY, true);
