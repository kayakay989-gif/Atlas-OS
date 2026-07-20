-- M2: Discovery & Research Pipeline

CREATE TYPE public.company_status AS ENUM (
  'discovered',
  'crawling',
  'researching',
  'researched',
  'failed'
);

CREATE TYPE public.pipeline_job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- ─── ICP Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE public.icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  industries TEXT[] NOT NULL DEFAULT '{}'::text[],
  geographies TEXT[] NOT NULL DEFAULT '{}'::text[],
  company_size_min INTEGER CHECK (company_size_min IS NULL OR company_size_min >= 0),
  company_size_max INTEGER CHECK (company_size_max IS NULL OR company_size_max >= 0),
  keywords TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT icp_profiles_size_range CHECK (
    company_size_min IS NULL
    OR company_size_max IS NULL
    OR company_size_min <= company_size_max
  )
);

CREATE INDEX icp_profiles_organization_id_idx ON public.icp_profiles (organization_id);

-- ─── Companies ────────────────────────────────────────────────────────────────
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  icp_profile_id UUID REFERENCES public.icp_profiles (id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1),
  domain TEXT,
  website_url TEXT,
  status public.company_status NOT NULL DEFAULT 'discovered',
  source TEXT NOT NULL DEFAULT 'csv',
  source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX companies_organization_id_idx ON public.companies (organization_id, created_at DESC);
CREATE INDEX companies_icp_profile_id_idx ON public.companies (icp_profile_id);
CREATE INDEX companies_status_idx ON public.companies (organization_id, status);

-- ─── Company crawls ───────────────────────────────────────────────────────────
CREATE TABLE public.company_crawls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  status public.pipeline_job_status NOT NULL DEFAULT 'pending',
  extracted_content TEXT,
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX company_crawls_company_id_idx ON public.company_crawls (company_id, created_at DESC);

-- ─── Research reports ─────────────────────────────────────────────────────────
CREATE TABLE public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  status public.pipeline_job_status NOT NULL DEFAULT 'pending',
  summary TEXT,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  ux_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  positioning JSONB NOT NULL DEFAULT '{}'::jsonb,
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_model_output JSONB,
  model TEXT,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

CREATE INDEX research_reports_organization_id_idx ON public.research_reports (organization_id);

-- ─── Contacts ─────────────────────────────────────────────────────────────────
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  title TEXT,
  linkedin_url TEXT,
  source TEXT NOT NULL DEFAULT 'research',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contacts_company_id_idx ON public.contacts (company_id);
CREATE INDEX contacts_organization_id_idx ON public.contacts (organization_id);

-- ─── Pipeline jobs (orchestration tracking) ───────────────────────────────────
CREATE TABLE public.pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status public.pipeline_job_status NOT NULL DEFAULT 'pending',
  company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE,
  icp_profile_id UUID REFERENCES public.icp_profiles (id) ON DELETE SET NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pipeline_jobs_organization_id_idx ON public.pipeline_jobs (organization_id, created_at DESC);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER icp_profiles_updated_at
  BEFORE UPDATE ON public.icp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER research_reports_updated_at
  BEFORE UPDATE ON public.research_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pipeline_jobs_updated_at
  BEFORE UPDATE ON public.pipeline_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_icp_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'icp_profile.created', 'icp_profile', NEW.id::text,
      jsonb_build_object('name', NEW.name)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'icp_profile.updated', 'icp_profile', NEW.id::text,
      jsonb_build_object('name', NEW.name)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.write_audit_log(
      OLD.organization_id, 'icp_profile.deleted', 'icp_profile', OLD.id::text,
      jsonb_build_object('name', OLD.name)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_icp_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.icp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_icp_profile_changes();

CREATE OR REPLACE FUNCTION public.audit_company_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'company.discovered', 'company', NEW.id::text,
      jsonb_build_object('name', NEW.name, 'domain', NEW.domain, 'source', NEW.source)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'researched' AND OLD.status IS DISTINCT FROM 'researched' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'company.researched', 'company', NEW.id::text,
      jsonb_build_object('name', NEW.name)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_company_changes();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.icp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY icp_profiles_select ON public.icp_profiles
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY icp_profiles_insert ON public.icp_profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY icp_profiles_update ON public.icp_profiles
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY icp_profiles_delete ON public.icp_profiles
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY companies_insert ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY companies_update ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY companies_delete ON public.companies
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY company_crawls_select ON public.company_crawls
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY company_crawls_insert ON public.company_crawls
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY company_crawls_update ON public.company_crawls
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY research_reports_select ON public.research_reports
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY research_reports_insert ON public.research_reports
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY research_reports_update ON public.research_reports
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY contacts_select ON public.contacts
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

CREATE POLICY pipeline_jobs_select ON public.pipeline_jobs
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY pipeline_jobs_insert ON public.pipeline_jobs
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY pipeline_jobs_update ON public.pipeline_jobs
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
