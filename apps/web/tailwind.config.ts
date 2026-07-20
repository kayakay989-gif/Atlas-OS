import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import { atlasTailwindPreset } from '../../packages/config/tailwind/preset'

const config: Config = {
  ...atlasTailwindPreset,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [tailwindcssAnimate],
}

export default config
