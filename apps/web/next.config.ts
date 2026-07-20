import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  transpilePackages: [
    '@atlas/shared',
    '@atlas/ui',
    '@atlas/utils',
    '@atlas/database',
    '@atlas/types',
    '@atlas/config',
    '@atlas/deliverability',
    '@atlas/campaigns',
    '@atlas/meetings',
    '@atlas/conversion',
    '@atlas/learning',
    '@atlas/discovery',
    '@atlas/outreach',
    '@atlas/qualification',
  ],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  headers() {
    return Promise.resolve([{ source: '/(.*)', headers: securityHeaders }])
  },
}

export default nextConfig
