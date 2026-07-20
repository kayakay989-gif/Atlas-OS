'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import { runOpsMonitorAction } from '@/app/actions/ops'

export function RunMonitorButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await runOpsMonitorAction()
          window.location.reload()
        })
      }}
    >
      {pending ? 'Checking…' : 'Run monitoring check'}
    </Button>
  )
}
