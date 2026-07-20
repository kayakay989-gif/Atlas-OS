import { TeamManagement } from '@/components/features/settings/team-management'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function TeamSettingsPage() {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('memberships')
    .select(
      `
      *,
      profile:profiles (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
      )
    `,
    )
    .eq('organization_id', activeOrganization.id)

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Invite teammates and manage access for {activeOrganization.name}.
        </p>
      </div>
      <TeamManagement
        organizationId={activeOrganization.id}
        role={activeRole}
        members={members ?? []}
        invitations={invitations ?? []}
      />
    </div>
  )
}
