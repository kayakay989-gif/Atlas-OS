-- M4: Email Infrastructure (Deliverability)

CREATE TYPE public.domain_verification_status AS ENUM ('pending', 'verified', 'failed');

CREATE TYPE public.mailbox_provider AS ENUM ('google_workspace', 'smtp');

CREATE TYPE public.mailbox_status AS ENUM ('warming', 'active', 'paused', 'disabled');

CREATE TYPE public.suppression_reason AS ENUM (
  'hard_bounce',
  'soft_bounce',
  'unsubscribe',
  'manual',
  'complaint'
);

-- ─── Outreach domains ─────────────────────────────────────────────────────────
CREATE TABLE public.outreach_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (char_length(trim(domain)) >= 3),
  verification_status public.domain_verification_status NOT NULL DEFAULT 'pending',
  spf_valid BOOLEAN NOT NULL DEFAULT false,
  dkim_valid BOOLEAN NOT NULL DEFAULT false,
  dmarc_valid BOOLEAN NOT NULL DEFAULT false,
  dkim_selector TEXT NOT NULL DEFAULT 'default',
  dns_last_checked_at TIMESTAMPTZ,
  health_score INTEGER NOT NULL DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, domain)
);

CREATE INDEX outreach_domains_organization_id_idx ON public.outreach_domains (organization_id);

-- ─── Mailboxes ────────────────────────────────────────────────────────────────
CREATE TABLE public.mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.outreach_domains (id) ON DELETE CASCADE,
  email_address TEXT NOT NULL CHECK (email_address ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  display_name TEXT,
  provider public.mailbox_provider NOT NULL DEFAULT 'google_workspace',
  status public.mailbox_status NOT NULL DEFAULT 'warming',
  daily_send_limit INTEGER NOT NULL DEFAULT 50 CHECK (daily_send_limit > 0),
  sends_today INTEGER NOT NULL DEFAULT 0 CHECK (sends_today >= 0),
  sends_today_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,
  warm_up_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  health_score INTEGER NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  bounce_rate_30d NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (bounce_rate_30d >= 0 AND bounce_rate_30d <= 1),
  complaint_rate_30d NUMERIC(5, 4) NOT NULL DEFAULT 0
    CHECK (complaint_rate_30d >= 0 AND complaint_rate_30d <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email_address)
);

CREATE INDEX mailboxes_organization_id_idx ON public.mailboxes (organization_id);
CREATE INDEX mailboxes_domain_id_idx ON public.mailboxes (domain_id);

-- ─── Suppression list ─────────────────────────────────────────────────────────
CREATE TABLE public.suppression_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  reason public.suppression_reason NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE INDEX suppression_entries_organization_id_idx ON public.suppression_entries (organization_id);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER outreach_domains_updated_at
  BEFORE UPDATE ON public.outreach_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER mailboxes_updated_at
  BEFORE UPDATE ON public.mailboxes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_outreach_domain_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'domain.added', 'outreach_domain', NEW.id::text,
      jsonb_build_object('domain', NEW.domain)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.verification_status = 'verified'
    AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'domain.verified', 'outreach_domain', NEW.id::text,
      jsonb_build_object('domain', NEW.domain)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_outreach_domains
  AFTER INSERT OR UPDATE ON public.outreach_domains
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_outreach_domain_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.outreach_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppression_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY outreach_domains_select ON public.outreach_domains
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY outreach_domains_insert ON public.outreach_domains
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY outreach_domains_update ON public.outreach_domains
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY outreach_domains_delete ON public.outreach_domains
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY mailboxes_select ON public.mailboxes
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY mailboxes_insert ON public.mailboxes
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY mailboxes_update ON public.mailboxes
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY mailboxes_delete ON public.mailboxes
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY suppression_entries_select ON public.suppression_entries
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY suppression_entries_insert ON public.suppression_entries
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY suppression_entries_delete ON public.suppression_entries
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));
