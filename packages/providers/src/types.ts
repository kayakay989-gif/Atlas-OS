/** Shared health signal returned by provider adapters. */
export interface ProviderHealth {
  ok: boolean
  message?: string
}

/** Base contract for all pluggable providers (ADR-0011). */
export interface Provider {
  readonly id: string
  readonly name: string
  healthCheck(): Promise<ProviderHealth>
}
