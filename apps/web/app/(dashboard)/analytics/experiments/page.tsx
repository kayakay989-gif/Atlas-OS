import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { CreateExperimentForm } from '@/components/features/learning/create-experiment-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function ExperimentsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('learningOptimization', {
    organizationId: activeOrganization.id,
  })

  if (!enabled) {
    notFound()
  }

  const supabase = await createClient()
  const [{ data: experiments }, { data: campaigns }] = await Promise.all([
    supabase
      .from('ab_experiments')
      .select('id, name, experiment_type, status, created_at')
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('campaigns')
      .select('id, name')
      .eq('organization_id', activeOrganization.id)
      .order('name'),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <Link href="/analytics" className="text-muted-foreground text-sm hover:underline">
          ← Back to analytics
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">A/B experiments</h1>
        <p className="text-muted-foreground">
          Compare subject lines, copy variants, or send times using historical send data.
        </p>
      </div>

      <CreateExperimentForm campaigns={campaigns ?? []} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active experiments</h2>
        {!experiments || experiments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No experiments yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {experiments.map((experiment) => (
              <li
                key={experiment.id}
                className="flex items-center justify-between gap-4 p-4 text-sm"
              >
                <Link
                  href={`/analytics/experiments/${experiment.id}`}
                  className="font-medium hover:underline"
                >
                  {experiment.name}
                </Link>
                <span className="text-muted-foreground">
                  {experiment.experiment_type.replace('_', ' ')} · {experiment.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
