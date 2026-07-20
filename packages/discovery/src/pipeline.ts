import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@atlas/database/types'
import { csvDiscoveryProvider } from './providers/csv-provider'
import { crawlPublicWebsite } from './services/crawl-service'
import { generateResearchReport, PROMPT_VERSION } from './services/research-service'

type Client = SupabaseClient<Database>

export async function runCsvDiscovery(
  client: Client,
  input: { organizationId: string; icpProfileId: string; csvContent: string },
): Promise<{ companyIds: string[]; pipelineJobId: string }> {
  const { data: pipelineJob, error: jobError } = await client
    .from('pipeline_jobs')
    .insert({
      organization_id: input.organizationId,
      job_type: 'icp_discovery',
      status: 'running',
      icp_profile_id: input.icpProfileId,
      progress: 0,
      payload: { source: 'csv' },
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (jobError) throw jobError

  const { items } = await csvDiscoveryProvider.discover({
    query: input.icpProfileId,
    csvContent: input.csvContent,
  })

  const companyIds: string[] = []

  for (const item of items) {
    const websiteUrl =
      typeof item.metadata?.websiteUrl === 'string'
        ? item.metadata.websiteUrl
        : item.domain
          ? `https://${item.domain}`
          : null

    const { data: company, error } = await client
      .from('companies')
      .insert({
        organization_id: input.organizationId,
        icp_profile_id: input.icpProfileId,
        name: item.name,
        domain: item.domain ?? null,
        website_url: websiteUrl,
        source: 'csv',
        source_metadata: (item.metadata ?? {}) as Json,
        status: 'discovered',
      })
      .select('id')
      .single()

    if (error) throw error
    companyIds.push(company.id)
  }

  await client
    .from('pipeline_jobs')
    .update({
      status: 'completed',
      progress: 100,
      result: { companyCount: companyIds.length },
      completed_at: new Date().toISOString(),
    })
    .eq('id', pipelineJob.id)

  return { companyIds, pipelineJobId: pipelineJob.id }
}

export async function runCompanyPipeline(
  client: Client,
  input: { organizationId: string; companyId: string },
): Promise<void> {
  const { data: company, error: companyError } = await client
    .from('companies')
    .select('*')
    .eq('id', input.companyId)
    .eq('organization_id', input.organizationId)
    .single()

  if (companyError) {
    throw companyError
  }

  const websiteUrl = company.website_url ?? (company.domain ? `https://${company.domain}` : null)

  if (!websiteUrl) {
    await client
      .from('companies')
      .update({ status: 'failed', error_message: 'No website URL available for crawl' })
      .eq('id', company.id)
    return
  }

  try {
    await client.from('companies').update({ status: 'crawling' }).eq('id', company.id)

    const { data: crawl, error: crawlInsertError } = await client
      .from('company_crawls')
      .insert({
        organization_id: input.organizationId,
        company_id: company.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (crawlInsertError) throw crawlInsertError

    const crawlResult = await crawlPublicWebsite(websiteUrl)

    await client
      .from('company_crawls')
      .update({
        status: 'completed',
        extracted_content: crawlResult.extractedContent,
        pages_crawled: crawlResult.pagesCrawled,
        completed_at: new Date().toISOString(),
      })
      .eq('id', crawl.id)

    await client.from('companies').update({ status: 'researching' }).eq('id', company.id)

    const { data: reportRow, error: reportInsertError } = await client
      .from('research_reports')
      .insert({
        organization_id: input.organizationId,
        company_id: company.id,
        status: 'running',
      })
      .select('id')
      .single()

    if (reportInsertError) throw reportInsertError

    const report = generateResearchReport({
      companyName: company.name,
      domain: company.domain ?? undefined,
      crawlContent: crawlResult.extractedContent,
    })

    await client
      .from('research_reports')
      .update({
        status: 'completed',
        summary: report.summary,
        branding: report.branding,
        ux_analysis: report.uxAnalysis,
        positioning: report.positioning,
        pain_points: report.painPoints,
        raw_model_output: report,
        model: 'atlas-mock-v1',
        prompt_version: PROMPT_VERSION,
      })
      .eq('id', reportRow.id)

    if (report.suggestedContacts.length > 0) {
      await client.from('contacts').insert(
        report.suggestedContacts.map((contact) => ({
          organization_id: input.organizationId,
          company_id: company.id,
          full_name: contact.fullName,
          email: contact.email ?? null,
          title: contact.title ?? null,
          linkedin_url: contact.linkedinUrl ?? null,
          source: 'research',
          is_public: true,
        })),
      )
    }

    await client
      .from('companies')
      .update({ status: 'researched', error_message: null })
      .eq('id', company.id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed'
    await client
      .from('companies')
      .update({ status: 'failed', error_message: message })
      .eq('id', company.id)
    throw error
  }
}
