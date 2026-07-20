import type {
  DiscoveryInput,
  DiscoveryItem,
  DiscoveryProvider,
  DiscoveryResult,
} from '@atlas/providers'
import { parseCsvDiscoveryContent } from '../parse-csv'

export interface CsvDiscoveryInput extends DiscoveryInput {
  csvContent: string
}

export class CsvDiscoveryProvider implements DiscoveryProvider {
  readonly id = 'csv'
  readonly name = 'CSV Import'

  healthCheck(): Promise<{ ok: boolean; message?: string }> {
    return Promise.resolve({ ok: true })
  }

  discover(input: CsvDiscoveryInput): Promise<DiscoveryResult> {
    const rows = parseCsvDiscoveryContent(input.csvContent)
    const limit = input.limit ?? rows.length

    const items: DiscoveryItem[] = rows.slice(0, limit).map((row) => ({
      name: row.name,
      domain: row.domain,
      metadata: {
        websiteUrl: row.websiteUrl,
        source: 'csv',
      },
    }))

    return Promise.resolve({ items })
  }
}

export const csvDiscoveryProvider = new CsvDiscoveryProvider()
