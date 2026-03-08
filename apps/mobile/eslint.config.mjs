import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'babel.config.js', 'metro.config.js', 'jest.config.js'],
  },
];
