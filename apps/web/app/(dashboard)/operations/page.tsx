import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { AlertActions } from '@/components/features/ops/alert-actions'
import { RunMonitorButton } from '@/components/features/ops/run-monitor-button'
import { loadOperationsDashboard } from '@/app/actions/ops'
import { requireOrganizationContext } from '@/lib/auth/session'

const usageLabels: Record<string, string> = {
  email_sent: 'Emails sent',
  meeting_booked: 'Meetings booked',
  proposal_sent: 'Proposals sent',
  invoice_paid: 'Invoices paid',
  discovery_run: 'Discovery runs',
  ai_generation: 'AI generations',
}

export default async function OperationsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('opsMonitoring', { organizationId: activeOrganization.id })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Operations disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_OPS_MONITORING=true</code> for alerts, usage metering, and health
              checks.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { health, usage, alerts } = await loadOperationsDashboard()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Production</p>
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <p className="text-muted-foreground">
            System health, monitoring alerts, and usage metering for commercial readiness.
          </p>
        </div>
        <RunMonitorButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform health</CardDescription>
            <CardTitle className="text-2xl capitalize">{health.status}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Database latency</CardDescription>
            <CardTitle className="text-2xl">
              {health.checks.database?.latencyMs !== undefined
                ? `${health.checks.database.latencyMs}ms`
                : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open alerts</CardDescription>
            <CardTitle className="text-2xl">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Health checks</h2>
        <ul className="divide-y rounded-lg border">
          {Object.entries(health.checks).map(([name, check]) => (
            <li key={name} className="flex items-center justify-between gap-4 p-4 text-sm">
              <span className="font-medium capitalize">{name}</span>
              <span className="text-muted-foreground">
                {check.status}
                {check.latencyMs !== undefined ? ` · ${check.latencyMs}ms` : ''}
                {check.message ? ` · ${check.message}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No open alerts. Monitoring checks pass.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{alert.message}</p>
                    <p className="text-muted-foreground mt-2 text-xs capitalize">
                      {alert.severity} · {alert.status}
                    </p>
                  </div>
                  <AlertActions alertId={alert.id} status={alert.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Usage (last 30 days)</h2>
        {usage.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No usage events recorded yet. Events are tracked as the pipeline runs.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {usage.map((row) => (
              <li
                key={row.eventType}
                className="flex items-center justify-between gap-4 p-4 text-sm"
              >
                <span>{usageLabels[row.eventType] ?? row.eventType}</span>
                <span className="font-medium">{row.total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
