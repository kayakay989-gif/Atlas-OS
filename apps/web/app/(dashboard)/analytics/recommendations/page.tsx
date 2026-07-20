import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { RecommendationActions } from '@/components/features/learning/recommendation-actions'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function RecommendationsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('learningOptimization', {
    organizationId: activeOrganization.id,
  })

  if (!enabled) {
    notFound()
  }

  const supabase = await createClient()
  const { data: recommendations } = await supabase
    .from('optimization_recommendations')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link href="/analytics" className="text-muted-foreground text-sm hover:underline">
          ← Back to analytics
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Recommendations</h1>
        <p className="text-muted-foreground">
          Review and accept optimization suggestions. Changes are not auto-applied in M8.
        </p>
      </div>

      {!recommendations || recommendations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No recommendations yet. Run analysis from the analytics dashboard.
        </p>
      ) : (
        <ul className="space-y-4">
          {recommendations.map((item) => (
            <li key={item.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{item.summary}</p>
                  <p className="text-muted-foreground mt-2 text-xs capitalize">
                    {item.recommendation_type.replace('_', ' ')} · {item.status} ·{' '}
                    {item.confidence_score}% confidence
                  </p>
                </div>
                <RecommendationActions recommendationId={item.id} status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
