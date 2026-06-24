import base from '@abe/config/eslint';

export default [
  ...base,
  {
    ignores: ['dist/**', 'scripts/**'],
  },
  {
    files: ['prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
