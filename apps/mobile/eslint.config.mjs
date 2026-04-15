import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    // Mirror the web hook-size rule: combined `use-X.ts` capped at 150 LOC.
    // When a hook crosses that, promote to `use-X-queries.ts` + `use-X-mutations.ts`
    // + `use-X.ts` (barrel). Split variants are intentionally ignored so each
    // side can grow as needed (mutations can stay larger because of optimistic
    // update boilerplate). See ADR-012 enforcement matrix.
    files: ['src/hooks/use-*.ts'],
    ignores: ['src/hooks/use-*-queries.ts', 'src/hooks/use-*-mutations.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'babel.config.js', 'metro.config.js', 'jest.config.js'],
  },
];
