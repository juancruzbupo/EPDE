export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['web', 'api', 'shared', 'mobile', 'infra', 'ci', 'docs', 'deps', 'root'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
