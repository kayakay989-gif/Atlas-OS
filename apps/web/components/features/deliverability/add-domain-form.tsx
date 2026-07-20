'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { DeliverabilityActionState } from '@/app/actions/deliverability'

const initialState: DeliverabilityActionState = {}

interface AddDomainFormProps {
  action: (
    prev: DeliverabilityActionState,
    formData: FormData,
  ) => Promise<DeliverabilityActionState>
}

export function AddDomainForm({ action }: AddDomainFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domain">Outreach domain</Label>
        <Input id="domain" name="domain" placeholder="mail.acme.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dkimSelector">DKIM selector</Label>
        <Input id="dkimSelector" name="dkimSelector" defaultValue="default" />
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add domain'}
      </Button>
    </form>
  )
}
