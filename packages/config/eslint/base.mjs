import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

/** Shared Atlas ESLint flat config — extend in apps/packages as needed. */
export const atlasIgnores = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/.trigger/**',
  'packages/database/src/types.ts',
]

export const atlasRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/no-unnecessary-type-parameters': 'off',
}

/** Block Trigger.dev SDK outside the worker adapter (ADR-0007). */
export const triggerDevRestriction = {
  files: ['**/*.{ts,tsx,mts,cts}'],
  ignores: ['apps/worker/src/adapters/**'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@trigger.dev/sdk',
            message: 'Import @trigger.dev/sdk only in apps/worker/src/adapters/.',
          },
        ],
      },
    ],
  },
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname + '/../../..',
      },
    },
  },
  { ignores: atlasIgnores },
  { rules: atlasRules },
  triggerDevRestriction,
)
