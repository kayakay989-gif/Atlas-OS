export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,json,md,css,yml,yaml}': ['prettier --write'],
  '*.{js,jsx,ts,tsx,mjs,cjs}': (files) => {
    const eslintFiles = files.filter((file) => {
      const normalized = file.replace(/\\/g, '/')
      return (
        !normalized.includes('/scripts/') &&
        !normalized.includes('packages/config/eslint/') &&
        !normalized.endsWith('lint-staged.config.js')
      )
    })
    if (eslintFiles.length === 0) return []
    return [`eslint --fix ${eslintFiles.map((file) => JSON.stringify(file)).join(' ')}`]
  },
}
