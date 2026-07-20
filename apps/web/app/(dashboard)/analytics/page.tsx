import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { RunAnalysisButton } from '@/components/features/learning/run-analysis-button'
import { loadAnalyticsDashboard } from '@/app/actions/learning'
import { requireOrganizationContext } from '@/lib/auth/session'

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

export default async function AnalyticsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('learningOptimization', {
    organizationId: activeOrganization.id,
  })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Analytics disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_LEARNING_OPTIMIZATION=true</code> to analyze campaign performance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { metrics, recommendations, experiments } = await loadAnalyticsDashboard()

  const totals = metrics.reduce(
    (acc, row) => ({
      sends: acc.sends + row.sends,
      replies: acc.replies + row.replies,
      meetings: acc.meetings + row.meetings,
      proposals: acc.proposals + row.proposals,
    }),
    { sends: 0, replies: 0, meetings: 0, proposals: 0 },
  )

  const overallReplyRate = totals.sends > 0 ? totals.replies / totals.sends : 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Learning</p>
          <h1 className="text-3xl font-bold tracking-tight">Campaign analytics</h1>
          <p className="text-muted-foreground">
            Performance trends, A/B tests, and optimization recommendations.
          </p>
        </div>
        <RunAnalysisButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total sends</CardDescription>
            <CardTitle className="text-2xl">{totals.sends}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reply rate</CardDescription>
            <CardTitle className="text-2xl">{formatRate(overallReplyRate)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Meetings</CardDescription>
            <CardTitle className="text-2xl">{totals.meetings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Proposals</CardDescription>
            <CardTitle className="text-2xl">{totals.proposals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campaign performance</h2>
          <Link href="/campaigns" className="text-primary text-sm hover:underline">
            View campaigns →
          </Link>
        </div>
        {metrics.length === 0 ? (
          <p className="text-muted-foreground text-sm">No campaign data yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {metrics.map((row) => (
              <li
                key={row.campaignId}
                className="flex items-center justify-between gap-4 p-4 text-sm"
              >
                <span className="font-medium">{row.campaignName}</span>
                <span className="text-muted-foreground">
                  {row.sends} sends · {formatRate(row.replyRate)} replies · {row.meetings} meetings
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent recommendations</h2>
          <Link href="/analytics/recommendations" className="text-primary text-sm hover:underline">
            View all →
          </Link>
        </div>
        {recommendations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Run learning analysis to generate ICP, copy, and send-time recommendations.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recommendations.map((item) => (
              <li key={item.id} className="p-4 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">
                  {item.recommendation_type.replace('_', ' ')} · {item.status} ·{' '}
                  {item.confidence_score}% confidence
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">A/B experiments</h2>
          <Link href="/analytics/experiments" className="text-primary text-sm hover:underline">
            Manage experiments →
          </Link>
        </div>
        {experiments.length === 0 ? (
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
