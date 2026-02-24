import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    ignores: ['tsup.config.ts', 'dist/'],
  },
];
