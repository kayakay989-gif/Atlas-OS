import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'

type Client = SupabaseClient<Database>

const DEFAULT_SEQUENCE = {
  name: 'Standard 3-step outreach',
  description: 'Intro, follow-up, and breakup emails with configurable delays.',
  steps: [
    {
      stepOrder: 1,
      delayDays: 0,
      subjectTemplate: 'Quick idea for {{company_name}}',
      bodyTemplate:
        'Hi {{contact_name}},\n\nI came across {{company_name}} and thought there may be a fit around {{pain_point}}.',
    },
    {
      stepOrder: 2,
      delayDays: 3,
      subjectTemplate: 'Following up — {{company_name}}',
      bodyTemplate:
        'Hi {{contact_name}},\n\nCircling back on my note about {{pain_point}} at {{company_name}}.',
    },
    {
      stepOrder: 3,
      delayDays: 7,
      subjectTemplate: 'Last note for {{company_name}}',
      bodyTemplate:
        'Hi {{contact_name}},\n\nLast follow-up from me — still open to compare notes on {{pain_point}}.',
    },
  ],
} as const

export async function ensureDefaultSequence(
  client: Client,
  organizationId: string,
): Promise<string> {
  const { data: settings } = await client
    .from('organization_outreach_settings')
    .select('default_sequence_id')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (settings?.default_sequence_id) {
    return settings.default_sequence_id
  }

  const { data: existingDefault } = await client
    .from('email_sequences')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_default', true)
    .maybeSingle()

  if (existingDefault) {
    await client.from('organization_outreach_settings').upsert({
      organization_id: organizationId,
      default_sequence_id: existingDefault.id,
    })
    return existingDefault.id
  }

  const { data: sequence, error: sequenceError } = await client
    .from('email_sequences')
    .insert({
      organization_id: organizationId,
      name: DEFAULT_SEQUENCE.name,
      description: DEFAULT_SEQUENCE.description,
      is_default: true,
      is_active: true,
    })
    .select('id')
    .single()

  if (sequenceError) {
    throw sequenceError
  }

  const { error: stepsError } = await client.from('sequence_steps').insert(
    DEFAULT_SEQUENCE.steps.map((step) => ({
      organization_id: organizationId,
      sequence_id: sequence.id,
      step_order: step.stepOrder,
      delay_days: step.delayDays,
      subject_template: step.subjectTemplate,
      body_template: step.bodyTemplate,
    })),
  )

  if (stepsError) {
    throw stepsError
  }

  await client.from('organization_outreach_settings').upsert({
    organization_id: organizationId,
    default_sequence_id: sequence.id,
  })

  return sequence.id
}
