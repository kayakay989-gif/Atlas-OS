import { DashboardSidebar } from '@/components/features/dashboard/sidebar'
import { getSessionContext } from '@/lib/auth/session'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { memberships, activeOrganization } = await getSessionContext()

  if (!activeOrganization) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar memberships={memberships} activeOrganizationId={activeOrganization.id} />
      <main className="bg-background flex-1">{children}</main>
    </div>
  )
}
