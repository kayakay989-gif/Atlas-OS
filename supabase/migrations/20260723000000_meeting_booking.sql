-- M6: Meeting Booking

CREATE TYPE public.calendar_provider AS ENUM ('google_calendar');

CREATE TYPE public.calendar_connection_status AS ENUM ('pending', 'connected', 'disconnected');

CREATE TYPE public.meeting_status AS ENUM (
  'scheduled',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

-- ─── Calendar connections (mock OAuth for M6) ─────────────────────────────────
CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  provider public.calendar_provider NOT NULL DEFAULT 'google_calendar',
  status public.calendar_connection_status NOT NULL DEFAULT 'pending',
  external_account_email TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, provider)
);

CREATE INDEX calendar_connections_organization_id_idx ON public.calendar_connections (organization_id);

-- ─── Availability settings ────────────────────────────────────────────────────
CREATE TABLE public.availability_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes >= 15 AND slot_duration_minutes <= 120),
  min_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (min_notice_hours >= 0),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  weekly_hours JSONB NOT NULL DEFAULT '{
    "monday": [{"start": "09:00", "end": "17:00"}],
    "tuesday": [{"start": "09:00", "end": "17:00"}],
    "wednesday": [{"start": "09:00", "end": "17:00"}],
    "thursday": [{"start": "09:00", "end": "17:00"}],
    "friday": [{"start": "09:00", "end": "17:00"}],
    "saturday": [],
    "sunday": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Booking links ────────────────────────────────────────────────────────────
CREATE TABLE public.booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE CHECK (char_length(token) >= 16),
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns (id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX booking_links_organization_id_idx ON public.booking_links (organization_id);
CREATE INDEX booking_links_token_idx ON public.booking_links (token) WHERE is_active = true;

-- ─── Meetings ─────────────────────────────────────────────────────────────────
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  booking_link_id UUID REFERENCES public.booking_links (id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts (id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  host_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL CHECK (attendee_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status public.meeting_status NOT NULL DEFAULT 'confirmed',
  confirmation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX meetings_organization_id_idx ON public.meetings (organization_id, scheduled_start);
CREATE INDEX meetings_host_user_id_idx ON public.meetings (host_user_id, scheduled_start);

-- ─── Meeting briefs ───────────────────────────────────────────────────────────
CREATE TABLE public.meeting_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES public.meetings (id) ON DELETE CASCADE UNIQUE,
  content TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX meeting_briefs_organization_id_idx ON public.meeting_briefs (organization_id);

-- ─── Updated at triggers ──────────────────────────────────────────────────────
CREATE TRIGGER calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER availability_settings_updated_at
  BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Audit triggers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_meeting_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.write_audit_log(
      NEW.organization_id, 'meeting.booked', 'meeting', NEW.id::text,
      jsonb_build_object(
        'attendee_email', NEW.attendee_email,
        'scheduled_start', NEW.scheduled_start
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_meetings
  AFTER INSERT ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_meeting_changes();

-- ─── Public booking helpers (anon-safe via SECURITY DEFINER) ──────────────────
CREATE OR REPLACE FUNCTION public.get_booking_link_public(link_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link public.booking_links%ROWTYPE;
  org public.organizations%ROWTYPE;
  availability public.availability_settings%ROWTYPE;
  contact_name TEXT;
  company_name TEXT;
BEGIN
  SELECT * INTO link
  FROM public.booking_links
  WHERE token = link_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  IF link.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired booking link';
  END IF;

  SELECT * INTO org FROM public.organizations WHERE id = link.organization_id;
  SELECT * INTO availability FROM public.availability_settings WHERE organization_id = link.organization_id;

  IF availability.organization_id IS NULL THEN
    INSERT INTO public.availability_settings (organization_id)
    VALUES (link.organization_id)
    RETURNING * INTO availability;
  END IF;

  IF link.contact_id IS NOT NULL THEN
    SELECT full_name INTO contact_name FROM public.contacts WHERE id = link.contact_id;
  END IF;

  IF link.company_id IS NOT NULL THEN
    SELECT name INTO company_name FROM public.companies WHERE id = link.company_id;
  END IF;

  RETURN jsonb_build_object(
    'organizationName', org.name,
    'timezone', availability.timezone,
    'slotDurationMinutes', availability.slot_duration_minutes,
    'minNoticeHours', availability.min_notice_hours,
    'weeklyHours', availability.weekly_hours,
    'contactName', contact_name,
    'companyName', company_name,
    'label', link.label
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.book_meeting_public(
  link_token TEXT,
  attendee_name TEXT,
  attendee_email TEXT,
  scheduled_start TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link public.booking_links%ROWTYPE;
  availability public.availability_settings%ROWTYPE;
  host_id UUID;
  meeting_id UUID;
  scheduled_end TIMESTAMPTZ;
  meeting_title TEXT;
BEGIN
  SELECT * INTO link
  FROM public.booking_links
  WHERE token = link_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF link.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired booking link';
  END IF;

  SELECT * INTO availability FROM public.availability_settings WHERE organization_id = link.organization_id;

  IF availability.organization_id IS NULL THEN
    RAISE EXCEPTION 'Availability not configured';
  END IF;

  IF scheduled_start < now() + (availability.min_notice_hours || ' hours')::interval THEN
    RAISE EXCEPTION 'Selected time is too soon';
  END IF;

  scheduled_end := scheduled_start + (availability.slot_duration_minutes || ' minutes')::interval;

  IF EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.organization_id = link.organization_id
      AND m.status IN ('scheduled', 'confirmed')
      AND tstzrange(m.scheduled_start, m.scheduled_end, '[)') && tstzrange(scheduled_start, scheduled_end, '[)')
  ) THEN
    RAISE EXCEPTION 'Selected time is no longer available';
  END IF;

  SELECT cc.user_id INTO host_id
  FROM public.calendar_connections cc
  WHERE cc.organization_id = link.organization_id
    AND cc.status = 'connected'
  ORDER BY cc.connected_at DESC NULLS LAST
  LIMIT 1;

  meeting_title := COALESCE(link.label, 'Intro call');
  IF link.company_id IS NOT NULL THEN
    SELECT name INTO meeting_title FROM public.companies WHERE id = link.company_id;
    meeting_title := 'Meeting with ' || meeting_title;
  END IF;

  INSERT INTO public.meetings (
    organization_id,
    booking_link_id,
    contact_id,
    company_id,
    host_user_id,
    title,
    scheduled_start,
    scheduled_end,
    timezone,
    attendee_name,
    attendee_email,
    status,
    confirmation_sent_at
  ) VALUES (
    link.organization_id,
    link.id,
    link.contact_id,
    link.company_id,
    host_id,
    meeting_title,
    scheduled_start,
    scheduled_end,
    availability.timezone,
    trim(attendee_name),
    lower(trim(attendee_email)),
    'confirmed',
    now()
  )
  RETURNING id INTO meeting_id;

  RETURN meeting_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_link_public(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_meeting_public(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendar_connections_select ON public.calendar_connections
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY calendar_connections_insert ON public.calendar_connections
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY calendar_connections_update ON public.calendar_connections
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY availability_settings_select ON public.availability_settings
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY availability_settings_insert ON public.availability_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY availability_settings_update ON public.availability_settings
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY booking_links_select ON public.booking_links
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY booking_links_insert ON public.booking_links
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY booking_links_update ON public.booking_links
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY meetings_select ON public.meetings
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY meetings_insert ON public.meetings
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY meetings_update ON public.meetings
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY meeting_briefs_select ON public.meeting_briefs
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE POLICY meeting_briefs_insert ON public.meeting_briefs
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY meeting_briefs_update ON public.meeting_briefs
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
