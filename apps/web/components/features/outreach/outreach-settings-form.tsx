'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { OutreachActionState } from '@/app/actions/outreach'

const initialState: OutreachActionState = {}

interface OutreachSettingsFormProps {
  requireManualApproval: boolean
  minQualificationScore: number
  action: (prev: OutreachActionState, formData: FormData) => Promise<OutreachActionState>
}

export function OutreachSettingsForm({
  requireManualApproval,
  minQualificationScore,
  action,
}: OutreachSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="requireManualApproval"
          name="requireManualApproval"
          type="checkbox"
          defaultChecked={requireManualApproval}
          className="h-4 w-4"
        />
        <Label htmlFor="requireManualApproval">Require manual approval before campaigns</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="minQualificationScore">Minimum qualification score</Label>
        <Input
          id="minQualificationScore"
          name="minQualificationScore"
          type="number"
          min={0}
          max={100}
          defaultValue={minQualificationScore}
          required
        />
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}
