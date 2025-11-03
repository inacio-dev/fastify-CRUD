import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/unified-signatures': 'off', // Bug no ESLint plugin - desabilitar temporariamente
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.test.ts',
      '**/*.helpers.ts',
      '*.log',
      '.env',
      '.env.*',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'package-lock.json',
      'yarn.lock',
      'migrations/**',
    ],
  },
)
