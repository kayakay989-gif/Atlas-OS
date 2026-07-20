'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label } from '@atlas/ui'
import { createCampaignAction, type CampaignActionState } from '@/app/actions/campaigns'

interface CreateCampaignFormProps {
  sequences: { id: string; name: string }[]
  mailboxes: { id: string; email_address: string }[]
}

const initialState: CampaignActionState = {}

export function CreateCampaignForm({ sequences, mailboxes }: CreateCampaignFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createCampaignAction, initialState)

  useEffect(() => {
    if (state.campaignId) {
      router.push(`/campaigns/${state.campaignId}`)
    }
  }, [state.campaignId, router])

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="name">Campaign name</Label>
        <Input id="name" name="name" required placeholder="Q3 SaaS outbound" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sequenceId">Sequence</Label>
        <select
          id="sequenceId"
          name="sequenceId"
          required
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select sequence</option>
          {sequences.map((sequence) => (
            <option key={sequence.id} value={sequence.id}>
              {sequence.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Mailboxes (rotation pool)</Label>
        <div className="space-y-2 rounded-md border p-3">
          {mailboxes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add mailboxes under Deliverability first.
            </p>
          ) : (
            mailboxes.map((mailbox) => (
              <label key={mailbox.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="mailboxIds" value={mailbox.id} />
                {mailbox.email_address}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue="UTC" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendWindowStart">Send window start</Label>
          <Input id="sendWindowStart" name="sendWindowStart" defaultValue="09:00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendWindowEnd">Send window end</Label>
          <Input id="sendWindowEnd" name="sendWindowEnd" defaultValue="17:00" />
        </div>
      </div>

      <Button type="submit" disabled={pending || mailboxes.length === 0}>
        {pending ? 'Creating…' : 'Create campaign'}
      </Button>
    </form>
  )
}
