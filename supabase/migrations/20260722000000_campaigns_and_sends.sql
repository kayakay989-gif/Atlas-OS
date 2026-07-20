-- M5: Campaigns & Replies

CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
);

CREATE TYPE public.campaign_contact_status AS ENUM (
  'pending',
  'active',
  'replied',
  'bounced',
  'unsubscribed',
  'completed',
  'skipped'
);

CREATE TYPE public.send_record_status AS ENUM ('queued', 'sent', 'failed', 'skipped');

CREATE TYPE public.reply_intent AS ENUM (
  'positive',
  'negative',
  'neutral',
  'out_of_office',
  'unsubscribe',
  'unknown'
);

-- ─── Campaigns ────────────────────────────────────────────────────────────────
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences (id) ON DELETE RESTRICT,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  send_window_start TIME NOT NULL DEFAULT '09:00',
  send_window_end TIME NOT NULL DEFAULT '17:00',
  sends_count INTEGER NOT NULL DEFAULT 0 CHECK (sends_count >= 0),
  replies_count INTEGER NOT NULL DEFAULT 0 CHECK (replies_count >= 0),
  bounces_count INTEGER NOT NULL DEFAULT 0 CHECK (bounces_count >= 0),
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX campaigns_organization_id_idx ON public.campaigns (organization_id, status);

-- ─── Campaign mailboxes (rotation pool) ───────────────────────────────────────
CREATE TABLE public.campaign_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  mailbox_id UUID NOT NULL REFERENCES public.mailboxes (id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL DEFAULT 0 CHECK (rotation_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, mailbox_id)
);

CREATE INDEX campaign_mailboxes_campaign_id_idx ON public.campaign_mailboxes (campaign_id, rotation_order);

-- ─── Campaign contacts ────────────────────────────────────────────────────────
CREATE TABLE public.campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  status public.campaign_contact_status NOT NULL DEFAULT 'pending',
  current_step_order INTEGER NOT NULL DEFAULT 1 CHECK (current_step_order >= 1),
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, contact_id)
);

CREATE INDEX campaign_contacts_campaign_id_idx ON public.campaign_contacts (campaign_id, status);
CREATE INDEX campaign_contacts_next_send_idx ON public.campaign_contacts (next_send_at)
  WHERE status IN ('pending', 'active');

-- ─── Send records ─────────────────────────────────────────────────────────────
CREATE TABLE public.send_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  campaign_contact_id UUID NOT NULL REFERENCES public.campaign_contacts (id) ON DELETE CASCADE,
  email_draft_id UUID REFERENCES public.email_drafts (id) ON DELETE SET NULL,
  mailbox_id UUID REFERENCES public.mailboxes (id) ON DELETE SET NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order >= 1),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status public.send_record_status NOT NULL DEFAULT 'queued',
  pre_send_failures JSONB NOT NULL DEFAULT '[]'::jsonb,
  external_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX send_records_campaign_id_idx ON public.send_records (campaign_id, status);
CREATE INDEX send_records_contact_id_idx ON public.send_records (campaign_contact_id, step_order);

-- ─── Inbound messages (reply detection) ───────────────────────────────────────
CREATE TABLE public.inbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns (id) ON DELETE SET NULL,
  campaign_contact_id UUID REFERENCES public.campaign_contacts (id) ON DELETE SET NULL,
  send_record_id UUID REFERENCES public.send_records (id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT NOT NULL,
  reply_intent public.reply_intent NOT NULL DEFAULT 'unknown',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  classified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX inbound_messages_organization_id_idx ON public.inbound_messages (organization_id, received_at DESC);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER campaign_contacts_updated_at
  BEFORE UPDATE ON public.campaign_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_campaign_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'campaign.created', 'campaign', NEW.id::text,
      jsonb_build_object('name', NEW.name, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'campaign.launched', 'campaign', NEW.id::text,
      jsonb_build_object('name', NEW.name)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_campaigns
  AFTER INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_campaign_changes();

CREATE OR REPLACE FUNCTION public.audit_send_record_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'sent' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'email.sent', 'send_record', NEW.id::text,
      jsonb_build_object(
        'campaign_id', NEW.campaign_id,
        'recipient', NEW.recipient_email,
        'step_order', NEW.step_order
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_send_records
  AFTER INSERT OR UPDATE ON public.send_records
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_send_record_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_mailboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.send_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY campaigns_insert ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY campaigns_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY campaigns_delete ON public.campaigns
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY campaign_mailboxes_select ON public.campaign_mailboxes
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY campaign_mailboxes_insert ON public.campaign_mailboxes
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY campaign_mailboxes_delete ON public.campaign_mailboxes
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY campaign_contacts_select ON public.campaign_contacts
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY campaign_contacts_insert ON public.campaign_contacts
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY campaign_contacts_update ON public.campaign_contacts
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY send_records_select ON public.send_records
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY send_records_insert ON public.send_records
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY send_records_update ON public.send_records
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY inbound_messages_select ON public.inbound_messages
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY inbound_messages_insert ON public.inbound_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY inbound_messages_update ON public.inbound_messages
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
