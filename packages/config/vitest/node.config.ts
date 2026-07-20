import { defineConfig } from 'vitest/config'

/** Shared Vitest defaults for Node packages. */
export const nodeVitestConfig = defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
})

/** Shared Vitest defaults for React packages/apps. */
export const reactVitestConfig = defineConfig({
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    setupFiles: [],
  },
})

export default nodeVitestConfig
