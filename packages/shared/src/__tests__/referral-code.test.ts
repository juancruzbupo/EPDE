import { describe, expect, it } from 'vitest';

import { generateReferralCode } from '../utils/referral-code';

/** Deterministic stand-in for Math.random — walks through the 0..1 range. */
function seededRandom(seeds: number[]): () => number {
  let i = 0;
  return () => seeds[i++ % seeds.length]!;
}

describe('generateReferralCode', () => {
  it('formats a normal first name as PREFIX-XYZ', () => {
    const code = generateReferralCode('Maria', seededRandom([0, 0.5, 0.9]));
    expect(code).toMatch(/^MARIA-[A-HJ-NP-Z2-9]{3}$/);
    // Alphabet has 32 chars; floor(0 * 32)=0 (A), floor(0.5 * 32)=16 (S),
    // floor(0.9 * 32)=28 (6). Locks the deterministic derivation.
    expect(code).toBe('MARIA-AS6');
  });

  it('strips accents', () => {
    const code = generateReferralCode('José', seededRandom([0.1, 0.2, 0.3]));
    expect(code.startsWith('JOSE-')).toBe(true);
  });

  it('takes only the first token of a multi-word name', () => {
    const code = generateReferralCode('Esteban Martín', seededRandom([0, 0, 0]));
    expect(code).toBe('ESTEBA-AAA');
  });

  it('truncates long first names to 6 characters', () => {
    const code = generateReferralCode('Maximiliano', seededRandom([0.5, 0.5, 0.5]));
    expect(code.startsWith('MAXIMI-')).toBe(true);
    expect(code).toHaveLength('MAXIMI-'.length + 3);
  });

  it('uppercases lowercase input', () => {
    const code = generateReferralCode('juan', seededRandom([0, 0, 0]));
    expect(code).toBe('JUAN-AAA');
  });

  it('drops non-alphabetic characters in the prefix', () => {
    // Split-on-whitespace keeps "Juan-Pablo" as a single token; the non-A-Z
    // filter then strips the dash, yielding "JUANPABLO" → truncated to "JUANPA".
    const code = generateReferralCode('Juan-Pablo', seededRandom([0, 0, 0]));
    expect(code).toBe('JUANPA-AAA');
  });

  it('falls back to USER prefix when name has no alphabetic characters', () => {
    const code = generateReferralCode('!!!', seededRandom([0, 0, 0]));
    expect(code).toBe('USER-AAA');
  });

  it('excludes ambiguous characters 0/O/1/I/l from the suffix', () => {
    // Run 50 generations and ensure none of the suffix characters are ambiguous.
    const ambiguous = /[0O1Il]/;
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode('Test');
      const suffix = code.split('-')[1];
      expect(suffix).not.toMatch(ambiguous);
    }
  });

  it('produces different suffixes across calls (non-deterministic path)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateReferralCode('Test'));
    }
    // With 30^3 ≈ 27k possibilities, 50 calls basically never collide.
    expect(codes.size).toBeGreaterThan(40);
  });
});
