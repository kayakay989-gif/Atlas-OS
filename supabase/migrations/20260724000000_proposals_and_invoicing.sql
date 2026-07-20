-- M7: Proposals & Invoicing

CREATE TYPE public.proposal_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'sent',
  'rejected'
);

CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');

CREATE TYPE public.onboarding_status AS ENUM ('pending', 'in_progress', 'completed');

-- ─── Proposals ────────────────────────────────────────────────────────────────
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  meeting_id UUID REFERENCES public.meetings (id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  content TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
  status public.proposal_status NOT NULL DEFAULT 'draft',
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX proposals_organization_id_idx ON public.proposals (organization_id, status);

-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
  status public.invoice_status NOT NULL DEFAULT 'draft',
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX invoices_organization_id_idx ON public.invoices (organization_id, status);

-- ─── Client onboarding workflows ──────────────────────────────────────────────
CREATE TABLE public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  proposal_id UUID NOT NULL REFERENCES public.proposals (id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices (id) ON DELETE SET NULL,
  status public.onboarding_status NOT NULL DEFAULT 'pending',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX onboarding_workflows_organization_id_idx ON public.onboarding_workflows (organization_id, status);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER onboarding_workflows_updated_at
  BEFORE UPDATE ON public.onboarding_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_proposal_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'proposal.created', 'proposal', NEW.id::text,
      jsonb_build_object('title', NEW.title, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'proposal.approved', 'proposal', NEW.id::text,
      jsonb_build_object('title', NEW.title)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'sent' AND OLD.status IS DISTINCT FROM 'sent' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'proposal.sent', 'proposal', NEW.id::text,
      jsonb_build_object('title', NEW.title)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_proposals
  AFTER INSERT OR UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_proposal_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY proposals_select ON public.proposals
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY proposals_insert ON public.proposals
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY proposals_update ON public.proposals
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY invoices_select ON public.invoices
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY invoices_insert ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY invoices_update ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY onboarding_workflows_select ON public.onboarding_workflows
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY onboarding_workflows_insert ON public.onboarding_workflows
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY onboarding_workflows_update ON public.onboarding_workflows
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
