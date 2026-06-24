import base from '@abe/config/eslint';

export default [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        sourceType: 'commonjs',
      },
    },
  },
];
