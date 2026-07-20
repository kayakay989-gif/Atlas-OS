'use client'

import { useActionState } from 'react'
import { canDeleteOrganization } from '@atlas/shared'
import { Button, Input, Label } from '@atlas/ui'
import {
  deleteOrganizationAction,
  updateOrganizationAction,
  type AuthActionState,
} from '@/app/actions/auth'

const initialState: AuthActionState = {}

interface OrganizationSettingsFormProps {
  organizationId: string
  organizationName: string
  role: string
}

export function OrganizationSettingsForm({
  organizationId,
  organizationName,
  role,
}: OrganizationSettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateOrganizationAction, initialState)

  return (
    <div className="space-y-8">
      <form action={formAction} className="max-w-lg space-y-4">
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="space-y-2">
          <Label htmlFor="name">Organization name</Label>
          <Input id="name" name="name" defaultValue={organizationName} required />
        </div>
        {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
        <Button type="submit" disabled={pending}>
          Save changes
        </Button>
      </form>

      {canDeleteOrganization(role as 'owner' | 'admin' | 'member') ? (
        <form
          action={async () => {
            await deleteOrganizationAction(organizationId)
          }}
          className="border-destructive/30 max-w-lg rounded-lg border p-4"
        >
          <h2 className="text-destructive font-semibold">Danger zone</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Permanently delete this organization and all associated data.
          </p>
          <Button type="submit" variant="outline" className="mt-4">
            Delete organization
          </Button>
        </form>
      ) : null}
    </div>
  )
}
