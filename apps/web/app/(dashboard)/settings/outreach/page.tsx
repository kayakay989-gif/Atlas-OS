import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { getOrCreateOutreachSettings } from '@atlas/qualification'
import { updateOutreachSettingsAction } from '@/app/actions/outreach'
import { OutreachSettingsForm } from '@/components/features/outreach/outreach-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function OutreachSettingsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('outreachGeneration', { organizationId: activeOrganization.id })
  const supabase = await createClient()
  const settings = await getOrCreateOutreachSettings(supabase, activeOrganization.id)

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <Link href="/settings" className="text-muted-foreground text-sm hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Outreach settings</h1>
        <p className="text-muted-foreground">Qualification thresholds and approval workflow.</p>
      </div>

      {!enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Outreach disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_OUTREACH_GENERATION=true</code> to configure outreach settings.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <OutreachSettingsForm
          requireManualApproval={settings.requireManualApproval}
          minQualificationScore={settings.minQualificationScore}
          action={updateOutreachSettingsAction}
        />
      )}
    </div>
  )
}
