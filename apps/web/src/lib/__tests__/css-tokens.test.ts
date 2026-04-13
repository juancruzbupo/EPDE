import {
  CHART_TOKENS_DARK,
  CHART_TOKENS_LIGHT,
  DESIGN_TOKENS_DARK,
  DESIGN_TOKENS_LIGHT,
  INSPECTION_TOKENS_DARK,
  INSPECTION_TOKENS_LIGHT,
  TASK_TYPE_TOKENS_DARK,
  TASK_TYPE_TOKENS_LIGHT,
} from '@epde/shared';
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Verify that the web globals.css defines a --color-* variable for every key
 * in DESIGN_TOKENS_LIGHT (the SSoT), AND that the actual values in :root and
 * .dark match DESIGN_TOKENS_LIGHT and DESIGN_TOKENS_DARK respectively.
 *
 * Web uses `@theme inline { --color-*: var(--*); }` to register Tailwind aliases,
 * with actual values defined in `:root {}` (light) and `.dark {}` (dark).
 */
describe('Web CSS token sync', () => {
  const cssPath = path.resolve(__dirname, '../../app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  /** Extract all `--color-*` variable names from the @theme inline block. */
  function extractCSSVarNames(): Set<string> {
    const matches = cssContent.matchAll(/--color-([\w-]+)/g);
    return new Set([...matches].map((m) => m[1]!));
  }

  /** Extract `--key: value` pairs from a CSS section matched by regex. */
  function extractSectionValues(sectionRegex: RegExp): Map<string, string> {
    const match = cssContent.match(sectionRegex);
    if (!match) return new Map();
    const entries = [...match[1]!.matchAll(/--([\w-]+):\s*([^;]+);/g)];
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

  it(':root values should match DESIGN_TOKENS_LIGHT', () => {
    const rootValues = extractSectionValues(/:root\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(DESIGN_TOKENS_LIGHT)) {
      const cssKey = toKebab(key);
      const actual = rootValues.get(cssKey);
      if (actual && actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('.dark values should match DESIGN_TOKENS_DARK', () => {
    const darkValues = extractSectionValues(/\.dark\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(DESIGN_TOKENS_DARK)) {
      const cssKey = toKebab(key);
      const actual = darkValues.get(cssKey);
      if (actual && actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it(':root should not define --color-* tokens absent from DESIGN_TOKENS_LIGHT (reverse check)', () => {
    const rootValues = extractSectionValues(/:root\s*\{([^}]+)\}/s);
    const sharedKeys = new Set(Object.keys(DESIGN_TOKENS_LIGHT).map(toKebab));
    // Known tokens in :root that are web-only shadcn/ui chrome (not in shared design tokens)
    const ALLOWLIST = new Set([
      'radius',
      'font-heading',
      'font-dm-serif',
      'popover',
      'popover-foreground', // shadcn/ui popover chrome
      'card',
      'card-foreground', // shadcn/ui card chrome (may differ from shared)
    ]);
    const orphans: string[] = [];

    for (const cssKey of rootValues.keys()) {
      // Only check color-semantic tokens (skip radius, font, sidebar, chart, task-type, guide)
      // guide-* tokens are checked separately against INSPECTION_TOKENS_LIGHT/DARK
      if (cssKey.startsWith('chart-') || cssKey.startsWith('task-') || cssKey.startsWith('sidebar'))
        continue;
      if (cssKey.startsWith('guide-')) continue;
      if (ALLOWLIST.has(cssKey)) continue;
      if (!sharedKeys.has(cssKey)) {
        orphans.push(`--${cssKey} defined in :root but not in DESIGN_TOKENS_LIGHT`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it(':root task-type values should match TASK_TYPE_TOKENS_LIGHT', () => {
    const rootValues = extractSectionValues(/:root\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(TASK_TYPE_TOKENS_LIGHT)) {
      const cssKey = `task-${key}`;
      const actual = rootValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in :root`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('.dark task-type values should match TASK_TYPE_TOKENS_DARK', () => {
    const darkValues = extractSectionValues(/\.dark\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(TASK_TYPE_TOKENS_DARK)) {
      const cssKey = `task-${key}`;
      const actual = darkValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in .dark`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  /** Convert chart token key (e.g. "chart1") to CSS var name (e.g. "chart-1"). */
  function toChartCssKey(key: string): string {
    return key.replace(/(\d)/, '-$1');
  }

  it(':root chart values should match CHART_TOKENS_LIGHT', () => {
    const rootValues = extractSectionValues(/:root\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(CHART_TOKENS_LIGHT)) {
      const cssKey = toChartCssKey(key);
      const actual = rootValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in :root`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('.dark chart values should match CHART_TOKENS_DARK', () => {
    const darkValues = extractSectionValues(/\.dark\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(CHART_TOKENS_DARK)) {
      const cssKey = toChartCssKey(key);
      const actual = darkValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in .dark`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  /** Convert camelCase inspection token key to CSS var name (e.g. guideOkBg → guide-ok-bg). */
  function toGuideCssKey(key: string): string {
    return key.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  it(':root guide values should match INSPECTION_TOKENS_LIGHT', () => {
    const rootValues = extractSectionValues(/:root\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(INSPECTION_TOKENS_LIGHT)) {
      const cssKey = toGuideCssKey(key);
      const actual = rootValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in :root`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('.dark guide values should match INSPECTION_TOKENS_DARK', () => {
    const darkValues = extractSectionValues(/\.dark\s*\{([^}]+)\}/s);
    const mismatches: string[] = [];

    for (const [key, expected] of Object.entries(INSPECTION_TOKENS_DARK)) {
      const cssKey = toGuideCssKey(key);
      const actual = darkValues.get(cssKey);
      if (!actual) {
        mismatches.push(`--${cssKey}: missing in .dark`);
      } else if (actual !== expected) {
        mismatches.push(`--${cssKey}: expected "${expected}", got "${actual}"`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
