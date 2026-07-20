'use client'

import { useActionState } from 'react'
import { Button, Input, Label } from '@atlas/ui'
import type { DiscoveryActionState } from '@/app/actions/discovery'

const initialState: DiscoveryActionState = {}

interface IcpProfileFormProps {
  action: (prev: DiscoveryActionState, formData: FormData) => Promise<DiscoveryActionState>
}

export function IcpProfileForm({ action }: IcpProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Profile name</Label>
        <Input id="name" name="name" placeholder="B2B SaaS — North America" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industries">Industries (comma-separated)</Label>
        <Input id="industries" name="industries" placeholder="Software, FinTech" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="geographies">Geographies (comma-separated)</Label>
        <Input id="geographies" name="geographies" placeholder="US, UK, Canada" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
        <Input id="keywords" name="keywords" placeholder="automation, outbound, AI" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companySizeMin">Min company size</Label>
          <Input id="companySizeMin" name="companySizeMin" type="number" min={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySizeMax">Max company size</Label>
          <Input id="companySizeMax" name="companySizeMax" type="number" min={0} />
        </div>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create ICP profile'}
      </Button>
    </form>
  )
}
