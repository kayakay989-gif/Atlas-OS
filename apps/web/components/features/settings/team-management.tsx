'use client'

import { useActionState } from 'react'
import { ROLES, canManageMembers } from '@atlas/shared'
import { Button, Input, Label } from '@atlas/ui'
import {
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  type AuthActionState,
} from '@/app/actions/auth'
import type { Invitation, Membership, Profile } from '@atlas/database/types'

const initialState: AuthActionState = {}

interface TeamManagementProps {
  organizationId: string
  role: string
  members: (Membership & { profile: Profile | null })[]
  invitations: Invitation[]
}

export function TeamManagement({
  organizationId,
  role,
  members,
  invitations,
}: TeamManagementProps) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState)
  const canManage = canManageMembers(role as 'owner' | 'admin' | 'member')

  return (
    <div className="space-y-8">
      {canManage ? (
        <form action={formAction} className="max-w-lg space-y-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="space-y-2">
            <Label htmlFor="email">Invite by email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="teammate@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={ROLES.MEMBER}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value={ROLES.MEMBER}>Member</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>
          {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
          <Button type="submit" disabled={pending}>
            Send invitation
          </Button>
        </form>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="divide-y rounded-lg border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">
                  {member.profile?.full_name ?? member.profile?.email ?? member.user_id}
                </p>
                <p className="text-muted-foreground">{member.profile?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                  {member.role}
                </span>
                {canManage && member.role !== ROLES.OWNER ? (
                  <form
                    action={async () => {
                      await removeMemberAction(member.id, organizationId)
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canManage ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending invitations</h2>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending invitations.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-muted-foreground">Role: {invitation.role}</p>
                  </div>
                  <form
                    action={async () => {
                      await revokeInvitationAction(invitation.id, organizationId)
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
