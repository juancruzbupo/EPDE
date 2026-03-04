import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { DESIGN_TOKENS_LIGHT } from '@epde/shared';

/**
 * Verify that the web globals.css defines a --color-* variable for every key
 * in DESIGN_TOKENS_LIGHT (the SSoT). This catches drift when a new design token
 * is added to shared but not propagated to the web CSS.
 *
 * Web uses `@theme inline { --color-*: var(--*); }` to register Tailwind aliases.
 */
describe('Web CSS token sync', () => {
  const cssPath = path.resolve(__dirname, '../../app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  /** Extract all `--color-*` variable names from the @theme inline block. */
  function extractCSSVarNames(): Set<string> {
    const matches = cssContent.matchAll(/--color-([\w-]+)/g);
    return new Set([...matches].map((m) => m[1]!));
  }

  /** Convert camelCase to kebab-case (e.g. primaryForeground → primary-foreground). */
  function toKebab(key: string): string {
    return key.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  it('should define a --color-* CSS variable for every DESIGN_TOKENS_LIGHT key', () => {
    const cssVars = extractCSSVarNames();
    const missing: string[] = [];

    for (const key of Object.keys(DESIGN_TOKENS_LIGHT)) {
      const expected = toKebab(key);
      if (!cssVars.has(expected)) {
        missing.push(`--color-${expected}`);
      }
    }

    expect(missing).toEqual([]);
  });
});
