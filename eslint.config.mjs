import eslintConfigPrettier from 'eslint-config-prettier';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  eslintConfigPrettier,
  { rules: { 'prefer-template': 'error' } },
  {
    ignores: ['*.config*', 'dist', 'node_modules']
  }
);
