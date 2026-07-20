'use client'

import { useTransition } from 'react'
import { Button } from '@atlas/ui'
import {
  launchCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
  runCampaignSendBatchAction,
} from '@/app/actions/campaigns'

interface CampaignActionsProps {
  campaignId: string
  status: string
}

export function CampaignActions({ campaignId, status }: CampaignActionsProps) {
  const [pending, startTransition] = useTransition()

  function run(action: (id: string) => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      await action(campaignId)
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' ? (
        <Button disabled={pending} onClick={() => { run(launchCampaignAction); }}>
          Launch campaign
        </Button>
      ) : null}
      {status === 'active' ? (
        <>
          <Button variant="outline" disabled={pending} onClick={() => { run(pauseCampaignAction); }}>
            Pause
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => { run(runCampaignSendBatchAction); }}
          >
            Run send batch
          </Button>
        </>
      ) : null}
      {status === 'paused' ? (
        <Button disabled={pending} onClick={() => { run(resumeCampaignAction); }}>
          Resume
        </Button>
      ) : null}
    </div>
  )
}
