// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ✅ Ignore build + config files
  {
    ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
  },

  // ✅ Base ESLint recommended config
  eslint.configs.recommended,

  // ✅ TypeScript-aware rules + registers the @typescript-eslint plugin/parser
  ...tseslint.configs.recommended,

  // ✅ Prettier formatting
  eslintPluginPrettierRecommended,

  // ✅ Type-aware config — scoped only to TS files
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'prettier/prettier': 'warn',
    },
  },
);
