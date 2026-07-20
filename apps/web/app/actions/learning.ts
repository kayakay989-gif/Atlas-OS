'use server'

import { isFeatureEnabled } from '@atlas/config'
import {
  aggregateCampaignMetrics,
  createExperiment,
  getExperimentResults,
  reviewRecommendation,
  runLearningAnalysis,
} from '@atlas/learning'
import { createExperimentSchema, reviewRecommendationSchema } from '@atlas/types'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface LearningActionState {
  error?: string
  success?: string
  experimentId?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertLearningEnabled(organizationId: string): void {
  if (!isFeatureEnabled('learningOptimization', { organizationId })) {
    throw new Error(
      'Learning & optimization is disabled. Set FF_LEARNING_OPTIMIZATION=true to enable.',
    )
  }
}

export async function runLearningAnalysisAction(): Promise<LearningActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertLearningEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can run learning analysis' }
  }

  const supabase = await createClient()

  try {
    const result = await runLearningAnalysis(supabase, activeOrganization.id)

    revalidatePath('/analytics')
    revalidatePath('/analytics/recommendations')
    return {
      success: `Analysis complete. ${result.recommendationsCreated} new recommendations generated.`,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to run analysis' }
  }
}

export async function createExperimentAction(
  _prev: LearningActionState,
  formData: FormData,
): Promise<LearningActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertLearningEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can create experiments' }
  }

  const campaignId = getFormString(formData, 'campaignId')
  const parsed = createExperimentSchema.safeParse({
    name: getFormString(formData, 'name'),
    experimentType: getFormString(formData, 'experimentType'),
    campaignId: campaignId || undefined,
    variants: [
      {
        label: 'A',
        subjectPattern: getFormString(formData, 'variantASubject') || undefined,
        bodyPattern: getFormString(formData, 'variantABody') || undefined,
        sendHour: getFormString(formData, 'variantAHour')
          ? Number(getFormString(formData, 'variantAHour'))
          : undefined,
      },
      {
        label: 'B',
        subjectPattern: getFormString(formData, 'variantBSubject') || undefined,
        bodyPattern: getFormString(formData, 'variantBBody') || undefined,
        sendHour: getFormString(formData, 'variantBHour')
          ? Number(getFormString(formData, 'variantBHour'))
          : undefined,
      },
    ],
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid experiment input' }
  }

  const supabase = await createClient()

  try {
    const { experimentId } = await createExperiment(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
    })

    revalidatePath('/analytics/experiments')
    return { success: 'Experiment created', experimentId }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create experiment' }
  }
}

export async function reviewRecommendationAction(
  recommendationId: string,
  decision: 'accepted' | 'dismissed',
): Promise<LearningActionState> {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  assertLearningEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can review recommendations' }
  }

  const parsed = reviewRecommendationSchema.safeParse({ recommendationId, decision })
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid review input' }
  }

  const supabase = await createClient()

  try {
    await reviewRecommendation(supabase, {
      organizationId: activeOrganization.id,
      recommendationId,
      decision,
      reviewerId: user.id,
    })

    revalidatePath('/analytics/recommendations')
    return {
      success: decision === 'accepted' ? 'Recommendation accepted' : 'Recommendation dismissed',
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to review recommendation' }
  }
}

export async function loadAnalyticsDashboard() {
  const { activeOrganization } = await requireOrganizationContext()
  assertLearningEnabled(activeOrganization.id)

  const supabase = await createClient()
  const metrics = await aggregateCampaignMetrics(supabase, activeOrganization.id)

  const { data: recommendations } = await supabase
    .from('optimization_recommendations')
    .select('id, title, recommendation_type, status, confidence_score, created_at')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: experiments } = await supabase
    .from('ab_experiments')
    .select('id, name, experiment_type, status, created_at')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return { metrics, recommendations: recommendations ?? [], experiments: experiments ?? [] }
}

export async function loadExperimentDetail(experimentId: string) {
  const { activeOrganization } = await requireOrganizationContext()
  assertLearningEnabled(activeOrganization.id)

  const supabase = await createClient()

  const { data: experiment } = await supabase
    .from('ab_experiments')
    .select('*')
    .eq('id', experimentId)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!experiment) {
    return null
  }

  const results = await getExperimentResults(supabase, {
    organizationId: activeOrganization.id,
    experimentId,
  })

  return { experiment, results }
}
