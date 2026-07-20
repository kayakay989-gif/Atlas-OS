'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import { reviewRecommendationAction } from '@/app/actions/learning'

interface RecommendationActionsProps {
  recommendationId: string
  status: string
}

export function RecommendationActions({ recommendationId, status }: RecommendationActionsProps) {
  const [pending, startTransition] = useTransition()

  if (status !== 'pending') {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await reviewRecommendationAction(recommendationId, 'accepted')
            window.location.reload()
          })
        }}
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await reviewRecommendationAction(recommendationId, 'dismissed')
            window.location.reload()
          })
        }}
      >
        Dismiss
      </Button>
    </div>
  )
}
