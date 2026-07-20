import { csvDiscoveryRowSchema, type CsvDiscoveryRow } from '@atlas/types'

export function parseCsvDiscoveryContent(content: string): CsvDiscoveryRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return []
  }

  const headerLine = lines[0]
  if (!headerLine) {
    return []
  }

  const dataLines = lines.slice(1)
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase())

  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'company' || h === 'company_name')
  const domainIdx = headers.findIndex((h) => h === 'domain' || h === 'website')
  const urlIdx = headers.findIndex((h) => h === 'website_url' || h === 'url')

  const rows: CsvDiscoveryRow[] = []

  for (const line of dataLines) {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const name = nameIdx >= 0 ? cols[nameIdx] : cols[0]
    if (!name) continue

    const domain = domainIdx >= 0 ? cols[domainIdx] : undefined
    const websiteUrl = urlIdx >= 0 ? cols[urlIdx] : undefined

    const parsed = csvDiscoveryRowSchema.safeParse({
      name,
      domain: domain && !domain.startsWith('http') ? domain : undefined,
      websiteUrl: websiteUrl?.startsWith('http')
        ? websiteUrl
        : domain?.startsWith('http')
          ? domain
          : domain
            ? `https://${domain}`
            : undefined,
    })

    if (parsed.success) {
      rows.push(parsed.data)
    }
  }

  return rows
}
