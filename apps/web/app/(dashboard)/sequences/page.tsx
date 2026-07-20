import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { ensureDefaultSequence } from '@atlas/outreach'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function SequencesPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('outreachGeneration', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sequences disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_OUTREACH_GENERATION=true</code> to manage outreach sequences.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const sequenceId = await ensureDefaultSequence(supabase, activeOrganization.id)

  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', sequenceId)
    .single()

  if (!sequence) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <p className="text-muted-foreground text-sm">Default sequence could not be loaded.</p>
      </div>
    )
  }

  const { data: steps } = await supabase
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('step_order', { ascending: true })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link href="/outreach" className="text-muted-foreground text-sm hover:underline">
          ← Email drafts
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Sequences</h1>
        <p className="text-muted-foreground">Multi-step outreach with configurable delays.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{sequence.name}</CardTitle>
          <CardDescription>{sequence.description ?? 'Default outreach sequence'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!steps || steps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No steps configured.</p>
          ) : (
            steps.map((step) => (
              <div key={step.id} className="rounded-lg border p-4">
                <p className="font-medium">
                  Step {step.step_order} · Day {step.delay_days}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Subject: {step.subject_template}
                </p>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                  {step.body_template}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
