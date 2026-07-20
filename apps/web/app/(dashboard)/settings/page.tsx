import { OrganizationSettingsForm } from '@/components/features/settings/organization-settings-form'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function SettingsPage() {
  const { activeOrganization, activeRole } = await requireOrganizationContext()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
      </div>
      <OrganizationSettingsForm
        organizationId={activeOrganization.id}
        organizationName={activeOrganization.name}
        role={activeRole}
      />
      <p className="text-muted-foreground text-sm">
        Configure qualification and approval in{' '}
        <a href="/settings/outreach" className="text-primary hover:underline">
          outreach settings
        </a>
        .
      </p>
    </div>
  )
}
