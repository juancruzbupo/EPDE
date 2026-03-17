import { DESIGN_TOKENS_LIGHT, TASK_TYPE_TOKENS_LIGHT } from '@epde/shared';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verify that the mobile global.css defines a --color-* variable for every key
 * in DESIGN_TOKENS_LIGHT (the SSoT), AND that the actual values match.
 *
 * NativeWind uses `@theme inline { --color-*: #hex; }` with direct values
 * (unlike web which uses var() indirection).
 */
describe('Mobile CSS token sync', () => {
  const cssPath = path.resolve(__dirname, '../../global.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  /** Extract all `--color-*` variable names from the CSS file. */
  function extractCSSVarNames(): Set<string> {
    const matches = cssContent.matchAll(/--color-([\w-]+)/g);
    return new Set([...matches].map((m) => m[1]!));
  }

  /** Extract `--color-key: value` pairs from the @theme inline block. */
  function extractThemeValues(): Map<string, string> {
    const themeMatch = cssContent.match(/@theme\s+inline\s*\{([^}]+)\}/s);
    if (!themeMatch) return new Map();
    const entries = [...themeMatch[1]!.matchAll(/--color-([\w-]+):\s*([^;]+);/g)];
    return new Map(entries.map((m) => [m[1]!, m[2]!.trim()]));
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

  it('--color-* values should match DESIGN_TOKENS_LIGHT', () => {
    const themeValues = extractThemeValues();
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(DESIGN_TOKENS_LIGHT)) {
      const cssKey = toKebab(key);
      const actual = themeValues.get(cssKey);
      if (actual && actual !== expected) {
        mismatches.push(`--color-${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('CSS should not define --color-* tokens absent from DESIGN_TOKENS_LIGHT (reverse check)', () => {
    const themeValues = extractThemeValues();
    const sharedKeys = new Set(Object.keys(DESIGN_TOKENS_LIGHT).map(toKebab));
    const orphans: string[] = [];

    for (const cssKey of themeValues.keys()) {
      // Skip task-type tokens (checked separately)
      if (cssKey.startsWith('task-')) continue;
      if (!sharedKeys.has(cssKey)) {
        orphans.push(`--color-${cssKey} defined in CSS but not in DESIGN_TOKENS_LIGHT`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it('should define a --color-task-* CSS variable for every TASK_TYPE_TOKENS_LIGHT key', () => {
    const cssVars = extractCSSVarNames();
    const missing: string[] = [];

    for (const key of Object.keys(TASK_TYPE_TOKENS_LIGHT)) {
      const expected = `task-${key}`;
      if (!cssVars.has(expected)) {
        missing.push(`--color-${expected}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('--color-task-* values should match TASK_TYPE_TOKENS_LIGHT', () => {
    const themeValues = extractThemeValues();
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(TASK_TYPE_TOKENS_LIGHT)) {
      const cssKey = `task-${key}`;
      const actual = themeValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--color-${cssKey}: missing`);
      } else if (actual !== expected) {
        mismatches.push(`--color-${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
