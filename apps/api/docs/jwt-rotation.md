# JWT secret rotation

Tokens are signed with `JWT_SECRET` using HS256 (see
`apps/api/src/auth/strategies/jwt.strategy.ts`). HS256 uses the same secret for
sign and verify, so "rotating" the secret invalidates every in-flight access
and refresh token at once. This is a sharp operation — users mid-session are
logged out and must sign in again.

## When to rotate

- **Immediately** if the secret is suspected to have leaked (committed to a
  public repo, leaked from a backup, pasted into an AI prompt, etc.).
- **On a schedule** as hygiene — once per year is a reasonable default.
- **After offboarding** a contractor or employee who had access to the value
  in any of the hosted environments.

## Procedure (operator)

1. Announce a maintenance window. Rotating forces every active user to log in
   again; schedule for low-traffic hours.
2. Generate a new secret. `openssl rand -base64 48` is fine (>= 256 bits of
   entropy). Store it in the secret manager used by the target environment
   (e.g. Doppler, AWS Secrets Manager).
3. Update the `JWT_SECRET` env var in the runtime environment.
4. Restart all API instances. On NestJS startup, the new value is read at
   module construction time, so a fresh process picks it up automatically.
5. **No need** to flush Redis. Existing entries in `rt:` (refresh family) and
   `bl:` (blacklist) keyspaces remain valid data structures; they just reference
   JTIs of tokens that are no longer verifiable. They'll age out naturally via
   their TTLs (set in `TokenService`).
6. Verify: issue a fresh login against a canary client; confirm the returned
   tokens are accepted by downstream authenticated requests.

## What NOT to do

- Do not commit `JWT_SECRET` to the repo (the `.env.example` files ship with
  a placeholder — keep it that way).
- Do not keep both old and new secrets active. HS256 has no key-id header, so
  the API can only verify with a single key at a time. If you need zero-downtime
  rotation, migrate to RS256 first (separate sign/verify keys, `kid` header in
  the JWT lets you support multiple verify keys during the window).

## Future: RS256 + kid (not implemented)

If zero-downtime rotation becomes a requirement, the migration would be:

1. Switch `sign` and `verify` to RS256, generate a key pair.
2. Embed a `kid` claim referencing the current sign key.
3. On verify, look up the key by `kid` from an in-memory map that supports
   two keys simultaneously (current + previous).
4. Rotate by publishing a new sign key, keeping the old verify key hot until
   the longest token TTL has elapsed, then dropping it.

This is not planned — HS256 plus a scheduled forced-logout window is the
simplest thing that works for the user base today.
