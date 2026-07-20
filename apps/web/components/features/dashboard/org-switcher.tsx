'use client'

import type { OrganizationMembership } from '@/lib/auth/session'
import { Button } from '@atlas/ui'
import { switchOrganizationAction } from '@/app/actions/auth'

interface OrgSwitcherProps {
  memberships: OrganizationMembership[]
  activeOrganizationId: string
}

export function OrgSwitcher({ memberships, activeOrganizationId }: OrgSwitcherProps) {
  if (memberships.length <= 1) {
    const active = memberships.find((item) => item.organization.id === activeOrganizationId)
    return (
      <p className="truncate text-sm font-medium">{active?.organization.name ?? 'Organization'}</p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Workspace</p>
      <div className="flex flex-col gap-1">
        {memberships.map(({ organization }) => (
          <form
            key={organization.id}
            action={async () => {
              await switchOrganizationAction(organization.id)
            }}
          >
            <Button
              type="submit"
              variant={organization.id === activeOrganizationId ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start"
            >
              {organization.name}
            </Button>
          </form>
        ))}
      </div>
    </div>
  )
}
