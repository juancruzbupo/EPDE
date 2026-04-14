/**
 * Generates a referral code for a user's first name.
 *
 * Shape: `{FIRSTNAME}-{3 UNAMBIGUOUS ALPHANUMERIC}` — example: `MARIA-K3P`.
 *
 * Rules:
 *   - Prefix is the user's FIRST name only (first token on whitespace),
 *     uppercased, accent-stripped, truncated to 6 characters.
 *   - Suffix is 3 random alphanumeric characters drawn from
 *     `UNAMBIGUOUS_ALPHABET` (no 0/O/1/I/l to avoid transcription errors
 *     when a user dictates the code over the phone).
 *   - The generator itself doesn't guarantee uniqueness against the DB —
 *     the caller retries up to 5 times on unique-constraint conflict
 *     (see UserService.create). Collision probability per call:
 *     1 / 30^3 ≈ 0.0037% per-prefix, which is the relevant rate because
 *     the unique index is on the full code.
 */

const UNAMBIGUOUS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUFFIX_LENGTH = 3;
const MAX_PREFIX_LENGTH = 6;

function stripAccents(input: string): string {
  // NFD splits accented letters into base + combining mark, then we drop the marks.
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sanitizePrefix(firstName: string): string {
  const firstToken = firstName.trim().split(/\s+/)[0] ?? '';
  const asciiOnly = stripAccents(firstToken)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (!asciiOnly) {
    // Fallback — empty/symbol-only names still need SOMETHING for the prefix;
    // "USER" keeps the format predictable for the admin panel.
    return 'USER';
  }
  return asciiOnly.slice(0, MAX_PREFIX_LENGTH);
}

function randomSuffix(random: () => number = Math.random, length: number = SUFFIX_LENGTH): string {
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += UNAMBIGUOUS_ALPHABET.charAt(Math.floor(random() * UNAMBIGUOUS_ALPHABET.length));
  }
  return suffix;
}

export function generateReferralCode(
  firstName: string,
  random: () => number = Math.random,
): string {
  return `${sanitizePrefix(firstName)}-${randomSuffix(random)}`;
}
