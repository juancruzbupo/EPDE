import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Verifies the typography scale documented in `docs/design-system.md` matches
 * the `TYPE` const defined in `apps/mobile/src/lib/fonts.ts`. Keeps the doc
 * from silently rotting as font sizes are tuned (PR-UX-5 bumped labelMd 12→13
 * and the doc was one version behind — this test would have caught it).
 *
 * Code is treated as the source of truth. The table in the doc follows.
 */

const FONTS_SRC = readFileSync(
  resolve(__dirname, '../../../../apps/mobile/src/lib/fonts.ts'),
  'utf-8',
);

const DESIGN_SYSTEM_MD = readFileSync(
  resolve(__dirname, '../../../../docs/design-system.md'),
  'utf-8',
);

interface TypeEntry {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

/**
 * Parses `TYPE = { key: { fontFamily, fontSize, lineHeight }, ... }` entries
 * from fonts.ts. The source is small and stable (<30 lines), so a regex is
 * fine — no need for a TS AST walker.
 */
function parseFontsTs(src: string): Record<string, TypeEntry> {
  const result: Record<string, TypeEntry> = {};
  const entryRegex =
    /(\w+):\s*\{\s*fontFamily:\s*'([^']+)',\s*fontSize:\s*(\d+),\s*lineHeight:\s*(\d+)\s*\}/g;
  for (const match of src.matchAll(entryRegex)) {
    const [, key, fontFamily, fontSize, lineHeight] = match;
    result[key] = {
      fontFamily,
      fontSize: Number(fontSize),
      lineHeight: Number(lineHeight),
    };
  }
  return result;
}

/**
 * Parses the typography table in design-system.md. The expected row shape is
 * `| \`key\` | family | NNpx | NNpx |`.
 */
function parseTypographyTable(md: string): Record<string, TypeEntry> {
  const result: Record<string, TypeEntry> = {};
  const rowRegex = /\|\s*`(\w+)`\s*\|\s*([^|]+?)\s*\|\s*(\d+)px\s*\|\s*(\d+)px\s*\|/g;
  for (const match of md.matchAll(rowRegex)) {
    const [, key, family, fontSize, lineHeight] = match;
    result[key] = {
      fontFamily: family.trim(),
      fontSize: Number(fontSize),
      lineHeight: Number(lineHeight),
    };
  }
  return result;
}

describe('Typography parity (fonts.ts ↔ design-system.md)', () => {
  const fonts = parseFontsTs(FONTS_SRC);
  const doc = parseTypographyTable(DESIGN_SYSTEM_MD);

  it('fonts.ts parse extracts all expected keys', () => {
    // Sanity: if the regex stops matching (ex: someone changes the file
    // shape), this catches it before the real drift checks fail cryptically.
    expect(Object.keys(fonts).length).toBeGreaterThanOrEqual(10);
  });

  it('design-system.md parse extracts typography rows', () => {
    expect(Object.keys(doc).length).toBeGreaterThanOrEqual(10);
  });

  it('every TYPE key in fonts.ts appears in the design-system.md table', () => {
    const missing = Object.keys(fonts).filter((key) => !(key in doc));
    expect(missing).toEqual([]);
  });

  describe('row values match fonts.ts', () => {
    const entries = Object.entries(
      // Parsing at describe time so the test names show the keys rather than
      // dynamic placeholders.
      parseFontsTs(FONTS_SRC),
    );

    it.each(entries)('%s has matching fontSize + lineHeight in the doc', (key, typeEntry) => {
      const docEntry = doc[key];
      expect(docEntry).toBeDefined();
      expect(docEntry.fontSize).toBe(typeEntry.fontSize);
      expect(docEntry.lineHeight).toBe(typeEntry.lineHeight);
    });
  });
});
