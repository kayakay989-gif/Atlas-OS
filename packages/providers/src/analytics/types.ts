import type { Provider } from '../types'

/** Analytics and telemetry export providers. */
export interface AnalyticsProvider extends Provider {
  track(event: AnalyticsEvent): Promise<void>
}

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
}
