import type { Provider } from '../types'

/** Lead and company discovery sources (Apollo, CSV, Firecrawl, etc.). */
export interface DiscoveryProvider extends Provider {
  discover(input: DiscoveryInput): Promise<DiscoveryResult>
}

export interface DiscoveryInput {
  query: string
  limit?: number
}

export interface DiscoveryResult {
  items: DiscoveryItem[]
}

export interface DiscoveryItem {
  name: string
  domain?: string
  metadata?: Record<string, unknown>
}
