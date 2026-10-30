// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // Arquitectura limpia: dominio y aplicación no dependen de frameworks ni de las capas externas
    files: [
      'src/shared/domain/**/*.ts',
      'src/modules/*/domain/**/*.ts',
      'src/modules/*/application/**/*.ts',
    ],
    ignores: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@nestjs/*',
                'mongoose',
                'bcrypt',
                'passport*',
                'class-validator',
                'class-transformer',
                'express',
              ],
              message:
                'El dominio y la aplicación no importan frameworks: define un puerto (interfaz) en domain/.',
            },
            {
              group: ['**/infrastructure/**', '**/presentation/**'],
              message:
                'Las capas internas no importan de infrastructure/ ni presentation/.',
            },
          ],
        },
      ],
    },
  },
);
