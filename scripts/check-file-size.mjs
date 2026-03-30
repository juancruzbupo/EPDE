#!/usr/bin/env node

/**
 * CI check: fail if any .tsx/.ts source file exceeds MAX_LINES.
 * Enforces SIEMPRE #42 (mobile 400 LOC) and SIEMPRE #46-like limits.
 *
 * Usage: node scripts/check-file-size.mjs
 * Exit code 1 if violations found.
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';

const MAX_LINES = 500;
const PATTERNS = [
  'apps/web/src/**/*.{ts,tsx}',
  'apps/mobile/src/**/*.{ts,tsx}',
  'apps/api/src/**/*.ts',
];
const IGNORE = [
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/seed-demo.ts',
];

const files = PATTERNS.flatMap((p) => glob.sync(p, { ignore: IGNORE }));
const violations = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf-8').split('\n').length;
  if (lines > MAX_LINES) {
    violations.push({ file, lines });
  }
}

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const v of violations) {
    console.error(`  ${v.file} (${v.lines} lines)`);
  }
  console.error(`\nSplit large files per SIEMPRE #42/#43/#44.\n`);
  process.exit(1);
}

console.log(`✅ All ${files.length} source files are under ${MAX_LINES} lines.`);
