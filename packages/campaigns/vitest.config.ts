import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeVitestConfig } from '../../packages/config/vitest/node.config'

export default mergeConfig(nodeVitestConfig, defineConfig({}))
