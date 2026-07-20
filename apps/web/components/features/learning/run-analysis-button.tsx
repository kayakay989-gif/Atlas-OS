'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import { runLearningAnalysisAction } from '@/app/actions/learning'

export function RunAnalysisButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await runLearningAnalysisAction()
          window.location.reload()
        })
      }}
    >
      {pending ? 'Analyzing…' : 'Run learning analysis'}
    </Button>
  )
}
