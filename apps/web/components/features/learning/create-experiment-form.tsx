'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import { createExperimentAction, type LearningActionState } from '@/app/actions/learning'

interface CampaignOption {
  id: string
  name: string
}

interface CreateExperimentFormProps {
  campaigns: CampaignOption[]
}

const initialState: LearningActionState = {}

export function CreateExperimentForm({ campaigns }: CreateExperimentFormProps) {
  const [state, formAction, pending] = useActionState(createExperimentAction, initialState)

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Experiment name</Label>
        <Input id="name" name="name" required placeholder="Q3 subject line test" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experimentType">Type</Label>
        <select
          id="experimentType"
          name="experimentType"
          required
          defaultValue="subject_line"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="subject_line">Subject line</option>
          <option value="copy_variant">Copy variant</option>
          <option value="send_time">Send time</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaignId">Campaign (optional)</Label>
        <select
          id="campaignId"
          name="campaignId"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All campaigns</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Variant A</p>
          <Input name="variantASubject" placeholder="Subject contains…" />
          <Input name="variantABody" placeholder="Body contains…" />
          <Input name="variantAHour" type="number" min={0} max={23} placeholder="Send hour UTC" />
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Variant B</p>
          <Input name="variantBSubject" placeholder="Subject contains…" />
          <Input name="variantBBody" placeholder="Body contains…" />
          <Input name="variantBHour" type="number" min={0} max={23} placeholder="Send hour UTC" />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create experiment'}
      </Button>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-muted-foreground text-sm">{state.success}</p> : null}
    </form>
  )
}
