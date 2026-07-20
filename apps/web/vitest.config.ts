import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, mergeConfig } from 'vitest/config'
import { reactVitestConfig } from '../../packages/config/vitest/node.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  reactVitestConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': __dirname,
      },
    },
    test: {
      setupFiles: ['./vitest.setup.ts'],
      exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    },
  }),
)
