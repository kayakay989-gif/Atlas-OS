-- M9: Production Hardening — alerts, usage metering, performance indexes

CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE public.alert_status AS ENUM ('open', 'acknowledged', 'resolved');

CREATE TYPE public.usage_event_type AS ENUM (
  'email_sent',
  'meeting_booked',
  'proposal_sent',
  'invoice_paid',
  'discovery_run',
  'ai_generation'
);

-- ─── System alerts (monitoring) ─────────────────────────────────────────────────
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  alert_key TEXT NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  status public.alert_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX system_alerts_open_key_idx
  ON public.system_alerts (organization_id, alert_key)
  WHERE status = 'open';

CREATE INDEX system_alerts_organization_id_idx ON public.system_alerts (organization_id, status, severity);

-- ─── Usage events (commercial metering hooks) ───────────────────────────────────
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  event_type public.usage_event_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX usage_events_organization_id_idx ON public.usage_events (organization_id, event_type, recorded_at DESC);

-- ─── Performance indexes for dashboard hot paths ────────────────────────────────
CREATE INDEX IF NOT EXISTS send_records_org_sent_at_idx
  ON public.send_records (organization_id, sent_at DESC)
  WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS campaign_contacts_org_status_idx
  ON public.campaign_contacts (organization_id, status);

CREATE INDEX IF NOT EXISTS email_drafts_org_status_idx
  ON public.email_drafts (organization_id, status);

-- ─── Updated at trigger ─────────────────────────────────────────────────────────
CREATE TRIGGER system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_alerts_select ON public.system_alerts
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY system_alerts_insert ON public.system_alerts
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY system_alerts_update ON public.system_alerts
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY usage_events_select ON public.usage_events
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY usage_events_insert ON public.usage_events
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
