'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { DeliverabilityActionState } from '@/app/actions/deliverability'

const initialState: DeliverabilityActionState = {}

interface AddSuppressionFormProps {
  action: (
    prev: DeliverabilityActionState,
    formData: FormData,
  ) => Promise<DeliverabilityActionState>
}

export function AddSuppressionForm({ action }: AddSuppressionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" placeholder="blocked@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <select
          id="reason"
          name="reason"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          defaultValue="manual"
        >
          <option value="manual">Manual</option>
          <option value="hard_bounce">Hard bounce</option>
          <option value="soft_bounce">Soft bounce</option>
          <option value="unsubscribe">Unsubscribe</option>
          <option value="complaint">Complaint</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional context" />
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Suppress address'}
      </Button>
    </form>
  )
}
