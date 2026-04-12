/**
 * Certificate pinning configuration — PRE-PRODUCTION requirement (SIEMPRE #28).
 *
 * Implementation blocked until production API certificate is deployed.
 * Steps to activate:
 * 1. `npx expo install react-native-ssl-pinning`
 * 2. Extract SHA-256 pin: `openssl s_client -connect api.epde.com.ar:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64`
 * 3. Add pin hashes below (primary + backup for next cert rotation)
 * 4. Replace axios calls in api-client.ts with pinned fetch from react-native-ssl-pinning
 * 5. Test with Charles Proxy (should fail with pinning enabled)
 */

export const CERT_PINNING_CONFIG = {
  enabled: !__DEV__,
  domains: ['api.epde.com.ar'],
  pins: [] as string[], // SHA-256 hashes — fill before production launch
} as const;

/**
 * Log a warning in development when pinning is disabled.
 * Called once at app startup from the root layout.
 */
export function validateCertPinning(): void {
  if (__DEV__) {
    console.warn(
      '[CERT-PINNING] Certificate pinning is DISABLED in development. ' +
        'This is expected — pinning is enforced in production builds only.',
    );
    return;
  }

  if (CERT_PINNING_CONFIG.pins.length === 0) {
    console.error(
      '[CERT-PINNING] CRITICAL: No certificate pins configured for production! ' +
        'The app is vulnerable to MITM attacks. See apps/mobile/src/lib/cert-pinning.ts for setup.',
    );
  }
}
