-- M3: Qualification & Outreach Generation

CREATE TYPE public.lead_qualification_status AS ENUM ('pending', 'qualified', 'rejected');

CREATE TYPE public.email_draft_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected');

-- ─── Organization outreach settings ───────────────────────────────────────────
CREATE TABLE public.organization_outreach_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  require_manual_approval BOOLEAN NOT NULL DEFAULT true,
  min_qualification_score INTEGER NOT NULL DEFAULT 60
    CHECK (min_qualification_score >= 0 AND min_qualification_score <= 100),
  default_sequence_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Email sequences ──────────────────────────────────────────────────────────
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_sequences_organization_id_idx ON public.email_sequences (organization_id);

ALTER TABLE public.organization_outreach_settings
  ADD CONSTRAINT organization_outreach_settings_default_sequence_id_fkey
  FOREIGN KEY (default_sequence_id) REFERENCES public.email_sequences (id) ON DELETE SET NULL;

-- ─── Sequence steps ───────────────────────────────────────────────────────────
CREATE TABLE public.sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order >= 1),
  delay_days INTEGER NOT NULL DEFAULT 0 CHECK (delay_days >= 0),
  subject_template TEXT NOT NULL CHECK (char_length(trim(subject_template)) >= 1),
  body_template TEXT NOT NULL CHECK (char_length(trim(body_template)) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);

CREATE INDEX sequence_steps_sequence_id_idx ON public.sequence_steps (sequence_id, step_order);

-- ─── Lead scores ──────────────────────────────────────────────────────────────
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status public.lead_qualification_status NOT NULL DEFAULT 'pending',
  reasoning TEXT,
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

CREATE INDEX lead_scores_organization_id_idx ON public.lead_scores (organization_id, status);

-- ─── Email drafts ─────────────────────────────────────────────────────────────
CREATE TABLE public.email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences (id) ON DELETE CASCADE,
  sequence_step_id UUID NOT NULL REFERENCES public.sequence_steps (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order >= 1),
  status public.email_draft_status NOT NULL DEFAULT 'draft',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  quality_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_drafts_organization_id_idx ON public.email_drafts (organization_id, status);
CREATE INDEX email_drafts_company_id_idx ON public.email_drafts (company_id, step_order);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER organization_outreach_settings_updated_at
  BEFORE UPDATE ON public.organization_outreach_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sequence_steps_updated_at
  BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER lead_scores_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_lead_score_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NEW.status = 'qualified' THEN
      PERFORM public.write_audit_log(
        NEW.organization_id, 'lead.qualified', 'lead_score', NEW.id::text,
        jsonb_build_object('company_id', NEW.company_id, 'score', NEW.score)
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.write_audit_log(
        NEW.organization_id, 'lead.rejected', 'lead_score', NEW.id::text,
        jsonb_build_object('company_id', NEW.company_id, 'score', NEW.score)
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_lead_scores
  AFTER INSERT OR UPDATE ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_lead_score_changes();

CREATE OR REPLACE FUNCTION public.audit_email_draft_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'outreach.generated', 'email_draft', NEW.id::text,
      jsonb_build_object('company_id', NEW.company_id, 'step_order', NEW.step_order)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'outreach.approved', 'email_draft', NEW.id::text,
      jsonb_build_object('company_id', NEW.company_id, 'step_order', NEW.step_order)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_email_drafts
  AFTER INSERT OR UPDATE ON public.email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_email_draft_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.organization_outreach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_outreach_settings_select ON public.organization_outreach_settings
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY organization_outreach_settings_insert ON public.organization_outreach_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY organization_outreach_settings_update ON public.organization_outreach_settings
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY email_sequences_select ON public.email_sequences
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY email_sequences_insert ON public.email_sequences
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY email_sequences_update ON public.email_sequences
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY email_sequences_delete ON public.email_sequences
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY sequence_steps_select ON public.sequence_steps
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY sequence_steps_insert ON public.sequence_steps
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY sequence_steps_update ON public.sequence_steps
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY sequence_steps_delete ON public.sequence_steps
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY lead_scores_select ON public.lead_scores
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY lead_scores_insert ON public.lead_scores
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY lead_scores_update ON public.lead_scores
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_drafts_select ON public.email_drafts
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY email_drafts_insert ON public.email_drafts
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_drafts_update ON public.email_drafts
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY email_drafts_delete ON public.email_drafts
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));
