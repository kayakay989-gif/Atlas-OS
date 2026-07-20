import { promises as dns } from 'node:dns'
import type { DnsValidationResult } from '@atlas/types'

export interface DnsLookupClient {
  resolveTxt: (hostname: string) => Promise<string[][]>
}

const defaultClient: DnsLookupClient = {
  resolveTxt: (hostname) => dns.resolveTxt(hostname),
}

function flattenTxtRecords(records: string[][]): string[] {
  return records.map((chunks) => chunks.join(''))
}

export async function validateDomainDns(
  domain: string,
  dkimSelector: string,
  client: DnsLookupClient = defaultClient,
): Promise<DnsValidationResult> {
  const normalizedDomain = domain.trim().toLowerCase()
  const spfRecords: string[] = []
  const dkimRecords: string[] = []
  const dmarcRecords: string[] = []

  try {
    spfRecords.push(...flattenTxtRecords(await client.resolveTxt(normalizedDomain)))
  } catch {
    // Missing SPF records fail validation below.
  }

  try {
    dkimRecords.push(
      ...flattenTxtRecords(
        await client.resolveTxt(`${dkimSelector}._domainkey.${normalizedDomain}`),
      ),
    )
  } catch {
    // Missing DKIM records fail validation below.
  }

  try {
    dmarcRecords.push(...flattenTxtRecords(await client.resolveTxt(`_dmarc.${normalizedDomain}`)))
  } catch {
    // Missing DMARC records fail validation below.
  }

  const spfValid = spfRecords.some((record) => record.toLowerCase().includes('v=spf1'))
  const dkimValid = dkimRecords.some((record) => record.toLowerCase().includes('v=dkim1'))
  const dmarcValid = dmarcRecords.some((record) => record.toLowerCase().includes('v=dmarc1'))

  return {
    spfValid,
    dkimValid,
    dmarcValid,
    records: {
      spf: spfRecords,
      dkim: dkimRecords,
      dmarc: dmarcRecords,
    },
  }
}

export function computeDomainHealthScore(input: {
  spfValid: boolean
  dkimValid: boolean
  dmarcValid: boolean
}): number {
  let score = 0
  if (input.spfValid) score += 35
  if (input.dkimValid) score += 35
  if (input.dmarcValid) score += 30
  return score
}

export function getDnsSetupInstructions(
  domain: string,
  dkimSelector: string,
): {
  spf: string
  dkim: string
  dmarc: string
} {
  return {
    spf: `v=spf1 include:_spf.google.com ~all`,
    dkim: `Publish DKIM TXT at ${dkimSelector}._domainkey.${domain}`,
    dmarc: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
  }
}
