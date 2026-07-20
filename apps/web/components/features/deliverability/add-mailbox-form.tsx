'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { DeliverabilityActionState } from '@/app/actions/deliverability'

const initialState: DeliverabilityActionState = {}

interface DomainOption {
  id: string
  domain: string
}

interface AddMailboxFormProps {
  domains: DomainOption[]
  action: (
    prev: DeliverabilityActionState,
    formData: FormData,
  ) => Promise<DeliverabilityActionState>
}

export function AddMailboxForm({ domains, action }: AddMailboxFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domainId">Domain</Label>
        <select
          id="domainId"
          name="domainId"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          required
        >
          <option value="">Select domain</option>
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.domain}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="emailAddress">Mailbox email</Label>
        <Input id="emailAddress" name="emailAddress" placeholder="sales@mail.acme.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" placeholder="Acme Sales" />
      </div>
      <input type="hidden" name="provider" value="google_workspace" />
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <Button type="submit" disabled={pending || domains.length === 0}>
        {pending ? 'Adding…' : 'Add mailbox'}
      </Button>
    </form>
  )
}
