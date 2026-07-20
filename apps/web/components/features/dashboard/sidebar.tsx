import Link from 'next/link'
import { APP_NAME } from '@atlas/shared'
import { signOutAction } from '@/app/actions/auth'
import type { OrganizationMembership } from '@/lib/auth/session'
import { Button } from '@atlas/ui'
import { OrgSwitcher } from './org-switcher'

interface DashboardSidebarProps {
  memberships: OrganizationMembership[]
  activeOrganizationId: string
}

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/settings', label: 'Settings' },
  { href: '/settings/team', label: 'Team' },
]

export function DashboardSidebar({ memberships, activeOrganizationId }: DashboardSidebarProps) {
  return (
    <aside className="bg-card flex w-64 flex-col border-r">
      <div className="border-b p-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {APP_NAME}
        </p>
        <OrgSwitcher memberships={memberships} activeOrganizationId={activeOrganizationId} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
