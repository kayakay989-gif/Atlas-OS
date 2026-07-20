import type { Provider } from '../types'

/** Web and data search providers. */
export interface SearchProvider extends Provider {
  search(input: SearchInput): Promise<SearchResult>
}

export interface SearchInput {
  query: string
  limit?: number
}

export interface SearchResult {
  items: SearchItem[]
}

export interface SearchItem {
  title: string
  url: string
  snippet?: string
}
