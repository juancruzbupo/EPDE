import { readFileSync } from 'fs';
import { resolve } from 'path';

import { DESIGN_TOKENS_DARK, DESIGN_TOKENS_LIGHT } from '../constants/design-tokens';

/**
 * Verifies that mobile theme-tokens.ts and web globals.css stay in sync
 * with the canonical DESIGN_TOKENS_LIGHT / DESIGN_TOKENS_DARK in shared.
 *
 * Prevents color drift between platforms (the most common design system bug).
 * Mobile imports the tokens at build time so it can't drift — the mobile
 * check here is a sanity check on the imports. Web copies the values into
 * CSS custom properties, so this suite iterates over every token key and
 * asserts the CSS variable holds the expected value.
 */

const WEB_CSS = readFileSync(
  resolve(__dirname, '../../../../apps/web/src/app/globals.css'),
  'utf-8',
);

const MOBILE_THEME = readFileSync(
  resolve(__dirname, '../../../../apps/mobile/src/lib/theme-tokens.ts'),
  'utf-8',
);

/** Converts a camelCase token key to its kebab-case CSS variable suffix. */
function toCssVar(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Extracts the first `<block>{...}` body matching `selector`. */
function extractBlock(css: string, selector: RegExp): string {
  const match = css.match(selector);
  if (!match) throw new Error(`Could not locate block matching ${selector}`);
  const start = match.index! + match[0].length;
  let depth = 1;
  let i = start;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    if (depth === 0) break;
    i++;
  }
  return css.slice(start, i);
}

function readVar(blockBody: string, cssVar: string): string | null {
  const regex = new RegExp(`--${cssVar}\\s*:\\s*([^;]+);`);
  const match = blockBody.match(regex);
  return match ? match[1].trim() : null;
}

describe('Design token parity', () => {
  describe('Web globals.css :root matches DESIGN_TOKENS_LIGHT', () => {
    const rootBody = extractBlock(WEB_CSS, /:root\s*\{/);

    const entries = Object.entries(DESIGN_TOKENS_LIGHT);
    it.each(entries)('--%s has the expected value', (key, expected) => {
      const actual = readVar(rootBody, toCssVar(key));
      // If the variable is absent on purpose (e.g. mobile-only token), the
      // shared tokens list should not include it. Failing with a clear
      // message points the dev at whichever side is wrong.
      expect(actual).not.toBeNull();
      expect(actual).toBe(expected);
    });
  });

  describe('Web globals.css .dark matches DESIGN_TOKENS_DARK', () => {
    const darkBody = extractBlock(WEB_CSS, /\.dark\s*\{/);

    const entries = Object.entries(DESIGN_TOKENS_DARK);
    it.each(entries)('--%s has the expected value (dark)', (key, expected) => {
      const actual = readVar(darkBody, toCssVar(key));
      expect(actual).not.toBeNull();
      expect(actual).toBe(expected);
    });
  });

  describe('Mobile theme-tokens.ts imports from shared (no drift possible)', () => {
    it('imports DESIGN_TOKENS_LIGHT from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('DESIGN_TOKENS_LIGHT');
    });

    it('imports DESIGN_TOKENS_DARK from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('DESIGN_TOKENS_DARK');
    });

    it('imports TASK_TYPE_TOKENS_LIGHT from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('TASK_TYPE_TOKENS_LIGHT');
    });

    it('imports TASK_TYPE_TOKENS_DARK from @epde/shared', () => {
      expect(MOBILE_THEME).toContain('TASK_TYPE_TOKENS_DARK');
    });
  });
});
