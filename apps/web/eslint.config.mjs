import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import { atlasIgnores, atlasRules, triggerDevRestriction } from '../../packages/config/eslint/base.mjs'

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
})

/** Next.js ESLint — extends next/core-web-vitals without duplicating typescript-eslint from root. */
export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      ...atlasIgnores,
      '.next/**',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'next.config.ts',
      'next-env.d.ts',
      'tailwind.config.ts',
      'playwright.config.ts',
      'vitest.config.ts',
    ],
  },
  {
    rules: {
      ...atlasRules,
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  triggerDevRestriction,
]
