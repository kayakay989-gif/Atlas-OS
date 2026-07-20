import react from '@vitejs/plugin-react'
import { defineConfig, mergeConfig } from 'vitest/config'
import { reactVitestConfig } from '../../packages/config/vitest/node.config'

export default mergeConfig(
  reactVitestConfig,
  defineConfig({
    plugins: [react()],
    test: {
      setupFiles: ['./vitest.setup.ts'],
      exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    },
  }),
)
