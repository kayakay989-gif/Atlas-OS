import type { Provider } from '../types'

/** Object and file storage providers. */
export interface StorageProvider extends Provider {
  put(input: StoragePutInput): Promise<StoragePutResult>
  get(key: string): Promise<StorageGetResult | null>
}

export interface StoragePutInput {
  key: string
  body: Uint8Array | string
  contentType?: string
}

export interface StoragePutResult {
  key: string
  url?: string
}

export interface StorageGetResult {
  key: string
  body: Uint8Array
  contentType?: string
}
