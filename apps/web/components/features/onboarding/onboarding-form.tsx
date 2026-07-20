'use client'

import { useActionState } from 'react'
import { slugifyOrganizationName } from '@atlas/types'
import { Button, Input, Label } from '@atlas/ui'
import { createOrganizationAction, type AuthActionState } from '@/app/actions/auth'

const initialState: AuthActionState = {}

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Atlas Solutions"
          required
          onChange={(event) => {
            const slugInput = document.getElementById('slug') as HTMLInputElement | null
            if (slugInput && !slugInput.dataset.touched) {
              slugInput.value = slugifyOrganizationName(event.target.value)
            }
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Workspace slug</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="atlas-solutions"
          onChange={() => {
            const slugInput = document.getElementById('slug') as HTMLInputElement | null
            if (slugInput) slugInput.dataset.touched = 'true'
          }}
        />
        <p className="text-muted-foreground text-xs">
          Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create organization'}
      </Button>
    </form>
  )
}
