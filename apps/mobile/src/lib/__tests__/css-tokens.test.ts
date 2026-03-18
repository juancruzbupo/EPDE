import {
  DESIGN_TOKENS_DARK,
  DESIGN_TOKENS_LIGHT,
  TASK_TYPE_TOKENS_DARK,
  TASK_TYPE_TOKENS_LIGHT,
} from '@epde/shared';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verify that the mobile global.css defines a --color-* variable for every key
 * in DESIGN_TOKENS_LIGHT (the SSoT), AND that the actual values match.
 *
 * NativeWind uses `@theme { --color-*: #hex; }` to define tokens (non-inline
 * so Tailwind emits var() references). Dark mode is applied via vars() in
 * the root layout (theme-tokens.ts), not via CSS .dark selector.
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
    const themeMatch = cssContent.match(/@theme(?:\s+inline)?\s*\{([^}]+)\}/s);
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

  // --- Dark mode token sync ---

  /** Extract `--color-key: value` pairs from the `.dark { }` block. */
  function extractDarkValues(): Map<string, string> {
    const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/s);
    if (!darkMatch) return new Map();
    const entries = [...darkMatch[1]!.matchAll(/--color-([\w-]+):\s*([^;]+);/g)];
    return new Map(entries.map((m) => [m[1]!, m[2]!.trim()]));
  }

  it('should define a .dark block with --color-* variables for every DESIGN_TOKENS_DARK key', () => {
    const darkValues = extractDarkValues();
    const missing: string[] = [];

    for (const key of Object.keys(DESIGN_TOKENS_DARK)) {
      const expected = toKebab(key);
      if (!darkValues.has(expected)) {
        missing.push(`--color-${expected}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('.dark --color-* values should match DESIGN_TOKENS_DARK', () => {
    const darkValues = extractDarkValues();
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(DESIGN_TOKENS_DARK)) {
      const cssKey = toKebab(key);
      const actual = darkValues.get(cssKey);
      if (actual && actual !== expected) {
        mismatches.push(`--color-${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('.dark should not define --color-* tokens absent from DESIGN_TOKENS_DARK (reverse check)', () => {
    const darkValues = extractDarkValues();
    const sharedKeys = new Set(Object.keys(DESIGN_TOKENS_DARK).map(toKebab));
    const orphans: string[] = [];

    for (const cssKey of darkValues.keys()) {
      // Skip task-type tokens (checked separately)
      if (cssKey.startsWith('task-')) continue;
      if (!sharedKeys.has(cssKey)) {
        orphans.push(`--color-${cssKey} defined in .dark CSS but not in DESIGN_TOKENS_DARK`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it('.dark should define --color-task-* variables for every TASK_TYPE_TOKENS_DARK key', () => {
    const darkValues = extractDarkValues();
    const missing: string[] = [];

    for (const key of Object.keys(TASK_TYPE_TOKENS_DARK)) {
      const expected = `task-${key}`;
      if (!darkValues.has(expected)) {
        missing.push(`--color-${expected}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('.dark --color-task-* values should match TASK_TYPE_TOKENS_DARK', () => {
    const darkValues = extractDarkValues();
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(TASK_TYPE_TOKENS_DARK)) {
      const cssKey = `task-${key}`;
      const actual = darkValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--color-${cssKey}: missing`);
      } else if (actual !== expected) {
        mismatches.push(`--color-${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
