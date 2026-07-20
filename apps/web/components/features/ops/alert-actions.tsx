'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import { acknowledgeAlertAction } from '@/app/actions/ops'

interface AlertActionsProps {
  alertId: string
  status: string
}

export function AlertActions({ alertId, status }: AlertActionsProps) {
  const [pending, startTransition] = useTransition()

  if (status !== 'open') {
    return null
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await acknowledgeAlertAction(alertId)
          window.location.reload()
        })
      }}
    >
      Acknowledge
    </Button>
  )
}
