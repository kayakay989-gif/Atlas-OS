-- M8: Learning & Optimization

CREATE TYPE public.experiment_status AS ENUM ('draft', 'running', 'completed', 'cancelled');

CREATE TYPE public.experiment_type AS ENUM ('subject_line', 'copy_variant', 'send_time');

CREATE TYPE public.recommendation_type AS ENUM ('icp_refinement', 'copy_pattern', 'send_time');

CREATE TYPE public.recommendation_status AS ENUM ('pending', 'accepted', 'dismissed');

CREATE TYPE public.content_feedback_type AS ENUM ('email_draft', 'proposal');

-- ─── A/B experiments ────────────────────────────────────────────────────────────
CREATE TABLE public.ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns (id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  experiment_type public.experiment_type NOT NULL,
  status public.experiment_status NOT NULL DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ab_experiments_organization_id_idx ON public.ab_experiments (organization_id, status);

-- ─── Experiment variants ──────────────────────────────────────────────────────
CREATE TABLE public.ab_experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.ab_experiments (id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(trim(label)) >= 1),
  subject_pattern TEXT,
  body_pattern TEXT,
  send_hour INTEGER CHECK (send_hour IS NULL OR (send_hour >= 0 AND send_hour <= 23)),
  sends_count INTEGER NOT NULL DEFAULT 0 CHECK (sends_count >= 0),
  replies_count INTEGER NOT NULL DEFAULT 0 CHECK (replies_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, label)
);

CREATE INDEX ab_experiment_variants_experiment_id_idx ON public.ab_experiment_variants (experiment_id);

-- ─── Optimization recommendations ───────────────────────────────────────────────
CREATE TABLE public.optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  recommendation_type public.recommendation_type NOT NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 2),
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0
    CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status public.recommendation_status NOT NULL DEFAULT 'pending',
  icp_profile_id UUID REFERENCES public.icp_profiles (id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX optimization_recommendations_organization_id_idx
  ON public.optimization_recommendations (organization_id, status);

-- ─── Human edit feedback (for future prompt improvement) ────────────────────────
CREATE TABLE public.content_edit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  content_type public.content_feedback_type NOT NULL,
  source_id UUID NOT NULL,
  original_subject TEXT,
  original_body TEXT NOT NULL,
  edited_subject TEXT,
  edited_body TEXT NOT NULL,
  editor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX content_edit_feedback_organization_id_idx
  ON public.content_edit_feedback (organization_id, content_type, created_at DESC);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER ab_experiments_updated_at
  BEFORE UPDATE ON public.ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ab_experiment_variants_updated_at
  BEFORE UPDATE ON public.ab_experiment_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER optimization_recommendations_updated_at
  BEFORE UPDATE ON public.optimization_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_recommendation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'recommendation.created', 'recommendation', NEW.id::text,
      jsonb_build_object('type', NEW.recommendation_type, 'title', NEW.title)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'recommendation.accepted', 'recommendation', NEW.id::text,
      jsonb_build_object('title', NEW.title)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_optimization_recommendations
  AFTER INSERT OR UPDATE ON public.optimization_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_recommendation_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_edit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_experiments_select ON public.ab_experiments
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY ab_experiments_insert ON public.ab_experiments
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY ab_experiments_update ON public.ab_experiments
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY ab_experiment_variants_select ON public.ab_experiment_variants
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY ab_experiment_variants_insert ON public.ab_experiment_variants
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY ab_experiment_variants_update ON public.ab_experiment_variants
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY optimization_recommendations_select ON public.optimization_recommendations
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY optimization_recommendations_insert ON public.optimization_recommendations
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY optimization_recommendations_update ON public.optimization_recommendations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY content_edit_feedback_select ON public.content_edit_feedback
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY content_edit_feedback_insert ON public.content_edit_feedback
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
