import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { loadExperimentDetail } from '@/app/actions/learning'
import { requireOrganizationContext } from '@/lib/auth/session'

interface ExperimentDetailPageProps {
  params: Promise<{ id: string }>
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export default async function ExperimentDetailPage({ params }: ExperimentDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('learningOptimization', {
    organizationId: activeOrganization.id,
  })

  if (!enabled) {
    notFound()
  }

  const detail = await loadExperimentDetail(id)
  if (!detail) {
    notFound()
  }

  const { experiment, results } = detail
  const stats = results[0]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link
          href="/analytics/experiments"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to experiments
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{experiment.name}</h1>
        <p className="text-muted-foreground capitalize">
          {experiment.experiment_type.replace('_', ' ')} · {experiment.status}
        </p>
      </div>

      {stats?.significant !== undefined ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {stats.significant ? 'Statistically significant result' : 'Not yet significant'}
            </CardTitle>
            <CardDescription>
              {stats.significant
                ? `Variant ${results.find((row) => row.isWinner)?.label ?? '—'} is leading.`
                : 'Collect more sends per variant for reliable comparison.'}
              {stats.pValue !== undefined ? ` p-value ≈ ${stats.pValue.toFixed(3)}` : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ul className="divide-y rounded-lg border">
        {results.map((variant) => (
          <li
            key={variant.variantId}
            className="flex items-center justify-between gap-4 p-4 text-sm"
          >
            <div>
              <p className="font-medium">
                Variant {variant.label}
                {variant.isWinner ? ' · Winner' : ''}
              </p>
              <p className="text-muted-foreground">
                {variant.sends} sends · {variant.replies} replies
              </p>
            </div>
            <span className="font-medium">{formatRate(variant.replyRate)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
