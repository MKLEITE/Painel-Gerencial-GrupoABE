import base from '@abe/config/eslint';
import globals from 'globals';

export default [
  ...base,
  {
    ignores: ['next-env.d.ts'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
