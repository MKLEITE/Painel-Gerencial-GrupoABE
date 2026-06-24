import base from '@abe/config/eslint';
import globals from 'globals';

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
