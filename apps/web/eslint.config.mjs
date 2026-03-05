// NOTE: QUERY_KEYS centralization and maxPages enforcement are handled via
// code review + ai-development-guide rules #14, #17 (AST-based ESLint
// selectors are too fragile for these patterns).
import rootConfig from '../../eslint.config.mjs';
import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...rootConfig,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Test files are excluded from tsconfig.json — skip projectService parsing
    files: ['src/**/__tests__/**/*.ts', 'src/**/__tests__/**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: false },
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/'],
  },
];
