// NOTE: QUERY_KEYS centralization and maxPages enforcement are handled via
// code review + ai-development-guide rules #14, #17 (AST-based ESLint
// selectors are too fragile for these patterns).
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/', '.next/', 'dist/'],
  },
];
