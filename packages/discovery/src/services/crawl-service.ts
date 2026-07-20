const MAX_CONTENT_LENGTH = 50_000

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface CrawlResult {
  extractedContent: string
  pagesCrawled: number
  websiteUrl: string
}

export async function crawlPublicWebsite(websiteUrl: string): Promise<CrawlResult> {
  const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`

  const response = await fetch(url, {
    headers: { 'User-Agent': 'AtlasSalesOS/1.0 (+https://atlas.local)' },
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    throw new Error(`Crawl failed with status ${response.status}`)
  }

  const html = await response.text()
  const extractedContent = stripHtml(html).slice(0, MAX_CONTENT_LENGTH)

  return {
    extractedContent,
    pagesCrawled: 1,
    websiteUrl: url,
  }
}
