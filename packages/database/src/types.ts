/** Database types — keep in sync with supabase/migrations; regenerate via pnpm db:types when Supabase CLI is available. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MembershipRole = 'owner' | 'admin' | 'member'
export type CompanyStatus = 'discovered' | 'crawling' | 'researching' | 'researched' | 'failed'
export type PipelineJobStatus = 'pending' | 'running' | 'completed' | 'failed'
export type LeadQualificationStatus = 'pending' | 'qualified' | 'rejected'
export type EmailDraftStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'
export type DomainVerificationStatus = 'pending' | 'verified' | 'failed'
export type MailboxProvider = 'google_workspace' | 'smtp'
export type MailboxStatus = 'warming' | 'active' | 'paused' | 'disabled'
export type SuppressionReason =
  'hard_bounce' | 'soft_bounce' | 'unsubscribe' | 'manual' | 'complaint'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
export type CampaignContactStatus =
  'pending' | 'active' | 'replied' | 'bounced' | 'unsubscribed' | 'completed' | 'skipped'
export type SendRecordStatus = 'queued' | 'sent' | 'failed' | 'skipped'
export type ReplyIntent =
  'positive' | 'negative' | 'neutral' | 'out_of_office' | 'unsubscribe' | 'unknown'
export type CalendarProvider = 'google_calendar'
export type CalendarConnectionStatus = 'pending' | 'connected' | 'disconnected'
export type MeetingStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type ProposalStatus = 'draft' | 'pending_review' | 'approved' | 'sent' | 'rejected'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed'
export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'cancelled'
export type ExperimentType = 'subject_line' | 'copy_variant' | 'send_time'
export type RecommendationType = 'icp_refinement' | 'copy_pattern' | 'send_time'
export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed'
export type ContentFeedbackType = 'email_draft' | 'proposal'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'
export type UsageEventType =
  | 'email_sent'
  | 'meeting_booked'
  | 'proposal_sent'
  | 'invoice_paid'
  | 'discovery_run'
  | 'ai_generation'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: MembershipRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: MembershipRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: MembershipRole
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: MembershipRole
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: MembershipRole
          invited_by: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: MembershipRole
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invitations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organization_settings: {
        Row: {
          organization_id: string
          feature_flags: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          feature_flags?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          feature_flags?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_settings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: true
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          actor_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          actor_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      icp_profiles: {
        Row: {
          id: string
          organization_id: string
          name: string
          industries: string[]
          geographies: string[]
          company_size_min: number | null
          company_size_max: number | null
          keywords: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          industries?: string[]
          geographies?: string[]
          company_size_min?: number | null
          company_size_max?: number | null
          keywords?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          industries?: string[]
          geographies?: string[]
          company_size_min?: number | null
          company_size_max?: number | null
          keywords?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          organization_id: string
          icp_profile_id: string | null
          name: string
          domain: string | null
          website_url: string | null
          status: CompanyStatus
          source: string
          source_metadata: Json
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          icp_profile_id?: string | null
          name: string
          domain?: string | null
          website_url?: string | null
          status?: CompanyStatus
          source?: string
          source_metadata?: Json
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          icp_profile_id?: string | null
          name?: string
          domain?: string | null
          website_url?: string | null
          status?: CompanyStatus
          source?: string
          source_metadata?: Json
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_crawls: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          status: PipelineJobStatus
          extracted_content: string | null
          pages_crawled: number
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          status?: PipelineJobStatus
          extracted_content?: string | null
          pages_crawled?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          status?: PipelineJobStatus
          extracted_content?: string | null
          pages_crawled?: number
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      research_reports: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          status: PipelineJobStatus
          summary: string | null
          branding: Json
          ux_analysis: Json
          positioning: Json
          pain_points: Json
          raw_model_output: Json | null
          model: string | null
          prompt_version: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          status?: PipelineJobStatus
          summary?: string | null
          branding?: Json
          ux_analysis?: Json
          positioning?: Json
          pain_points?: Json
          raw_model_output?: Json | null
          model?: string | null
          prompt_version?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          status?: PipelineJobStatus
          summary?: string | null
          branding?: Json
          ux_analysis?: Json
          positioning?: Json
          pain_points?: Json
          raw_model_output?: Json | null
          model?: string | null
          prompt_version?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          full_name: string | null
          email: string | null
          title: string | null
          linkedin_url: string | null
          source: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          full_name?: string | null
          email?: string | null
          title?: string | null
          linkedin_url?: string | null
          source?: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          full_name?: string | null
          email?: string | null
          title?: string | null
          linkedin_url?: string | null
          source?: string
          is_public?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pipeline_jobs: {
        Row: {
          id: string
          organization_id: string
          job_type: string
          status: PipelineJobStatus
          company_id: string | null
          icp_profile_id: string | null
          progress: number
          payload: Json
          result: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_type: string
          status?: PipelineJobStatus
          company_id?: string | null
          icp_profile_id?: string | null
          progress?: number
          payload?: Json
          result?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_type?: string
          status?: PipelineJobStatus
          company_id?: string | null
          icp_profile_id?: string | null
          progress?: number
          payload?: Json
          result?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_outreach_settings: {
        Row: {
          organization_id: string
          require_manual_approval: boolean
          min_qualification_score: number
          default_sequence_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          require_manual_approval?: boolean
          min_qualification_score?: number
          default_sequence_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          require_manual_approval?: boolean
          min_qualification_score?: number
          default_sequence_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sequence_steps: {
        Row: {
          id: string
          organization_id: string
          sequence_id: string
          step_order: number
          delay_days: number
          subject_template: string
          body_template: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          sequence_id: string
          step_order: number
          delay_days?: number
          subject_template: string
          body_template: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          sequence_id?: string
          step_order?: number
          delay_days?: number
          subject_template?: string
          body_template?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          score: number
          status: LeadQualificationStatus
          reasoning: string | null
          factors: Json
          model: string | null
          prompt_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          score: number
          status?: LeadQualificationStatus
          reasoning?: string | null
          factors?: Json
          model?: string | null
          prompt_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          score?: number
          status?: LeadQualificationStatus
          reasoning?: string | null
          factors?: Json
          model?: string | null
          prompt_version?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          contact_id: string | null
          sequence_id: string
          sequence_step_id: string
          step_order: number
          status: EmailDraftStatus
          subject: string
          body: string
          quality_issues: Json
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          contact_id?: string | null
          sequence_id: string
          sequence_step_id: string
          step_order: number
          status?: EmailDraftStatus
          subject: string
          body: string
          quality_issues?: Json
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          contact_id?: string | null
          sequence_id?: string
          sequence_step_id?: string
          step_order?: number
          status?: EmailDraftStatus
          subject?: string
          body?: string
          quality_issues?: Json
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      outreach_domains: {
        Row: {
          id: string
          organization_id: string
          domain: string
          verification_status: DomainVerificationStatus
          spf_valid: boolean
          dkim_valid: boolean
          dmarc_valid: boolean
          dkim_selector: string
          dns_last_checked_at: string | null
          health_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          domain: string
          verification_status?: DomainVerificationStatus
          spf_valid?: boolean
          dkim_valid?: boolean
          dmarc_valid?: boolean
          dkim_selector?: string
          dns_last_checked_at?: string | null
          health_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          domain?: string
          verification_status?: DomainVerificationStatus
          spf_valid?: boolean
          dkim_valid?: boolean
          dmarc_valid?: boolean
          dkim_selector?: string
          dns_last_checked_at?: string | null
          health_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      mailboxes: {
        Row: {
          id: string
          organization_id: string
          domain_id: string
          email_address: string
          display_name: string | null
          provider: MailboxProvider
          status: MailboxStatus
          daily_send_limit: number
          sends_today: number
          sends_today_reset_at: string
          warm_up_started_at: string
          health_score: number
          bounce_rate_30d: number
          complaint_rate_30d: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          domain_id: string
          email_address: string
          display_name?: string | null
          provider?: MailboxProvider
          status?: MailboxStatus
          daily_send_limit?: number
          sends_today?: number
          sends_today_reset_at?: string
          warm_up_started_at?: string
          health_score?: number
          bounce_rate_30d?: number
          complaint_rate_30d?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          domain_id?: string
          email_address?: string
          display_name?: string | null
          provider?: MailboxProvider
          status?: MailboxStatus
          daily_send_limit?: number
          sends_today?: number
          sends_today_reset_at?: string
          warm_up_started_at?: string
          health_score?: number
          bounce_rate_30d?: number
          complaint_rate_30d?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppression_entries: {
        Row: {
          id: string
          organization_id: string
          email: string
          reason: SuppressionReason
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          reason?: SuppressionReason
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          reason?: SuppressionReason
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          organization_id: string
          name: string
          sequence_id: string
          status: CampaignStatus
          timezone: string
          send_window_start: string
          send_window_end: string
          sends_count: number
          replies_count: number
          bounces_count: number
          started_at: string | null
          paused_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          sequence_id: string
          status?: CampaignStatus
          timezone?: string
          send_window_start?: string
          send_window_end?: string
          sends_count?: number
          replies_count?: number
          bounces_count?: number
          started_at?: string | null
          paused_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          sequence_id?: string
          status?: CampaignStatus
          timezone?: string
          send_window_start?: string
          send_window_end?: string
          sends_count?: number
          replies_count?: number
          bounces_count?: number
          started_at?: string | null
          paused_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_mailboxes: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string
          mailbox_id: string
          rotation_order: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id: string
          mailbox_id: string
          rotation_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string
          mailbox_id?: string
          rotation_order?: number
          created_at?: string
        }
        Relationships: []
      }
      campaign_contacts: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string
          contact_id: string
          company_id: string
          status: CampaignContactStatus
          current_step_order: number
          next_send_at: string | null
          last_sent_at: string | null
          replied_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id: string
          contact_id: string
          company_id: string
          status?: CampaignContactStatus
          current_step_order?: number
          next_send_at?: string | null
          last_sent_at?: string | null
          replied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string
          contact_id?: string
          company_id?: string
          status?: CampaignContactStatus
          current_step_order?: number
          next_send_at?: string | null
          last_sent_at?: string | null
          replied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      send_records: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string
          campaign_contact_id: string
          email_draft_id: string | null
          mailbox_id: string | null
          contact_id: string
          step_order: number
          recipient_email: string
          subject: string
          body: string
          status: SendRecordStatus
          pre_send_failures: Json
          external_message_id: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id: string
          campaign_contact_id: string
          email_draft_id?: string | null
          mailbox_id?: string | null
          contact_id: string
          step_order: number
          recipient_email: string
          subject: string
          body: string
          status?: SendRecordStatus
          pre_send_failures?: Json
          external_message_id?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string
          campaign_contact_id?: string
          email_draft_id?: string | null
          mailbox_id?: string | null
          contact_id?: string
          step_order?: number
          recipient_email?: string
          subject?: string
          body?: string
          status?: SendRecordStatus
          pre_send_failures?: Json
          external_message_id?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      inbound_messages: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string | null
          campaign_contact_id: string | null
          send_record_id: string | null
          from_email: string
          subject: string | null
          body_preview: string
          reply_intent: ReplyIntent
          received_at: string
          classified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id?: string | null
          campaign_contact_id?: string | null
          send_record_id?: string | null
          from_email: string
          subject?: string | null
          body_preview: string
          reply_intent?: ReplyIntent
          received_at?: string
          classified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string | null
          campaign_contact_id?: string | null
          send_record_id?: string | null
          from_email?: string
          subject?: string | null
          body_preview?: string
          reply_intent?: ReplyIntent
          received_at?: string
          classified_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          provider: CalendarProvider
          status: CalendarConnectionStatus
          external_account_email: string | null
          connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          provider?: CalendarProvider
          status?: CalendarConnectionStatus
          external_account_email?: string | null
          connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          provider?: CalendarProvider
          status?: CalendarConnectionStatus
          external_account_email?: string | null
          connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      availability_settings: {
        Row: {
          organization_id: string
          timezone: string
          slot_duration_minutes: number
          min_notice_hours: number
          buffer_minutes: number
          weekly_hours: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          timezone?: string
          slot_duration_minutes?: number
          min_notice_hours?: number
          buffer_minutes?: number
          weekly_hours?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          timezone?: string
          slot_duration_minutes?: number
          min_notice_hours?: number
          buffer_minutes?: number
          weekly_hours?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_links: {
        Row: {
          id: string
          organization_id: string
          token: string
          contact_id: string | null
          company_id: string | null
          campaign_id: string | null
          created_by: string | null
          label: string | null
          is_active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          token: string
          contact_id?: string | null
          company_id?: string | null
          campaign_id?: string | null
          created_by?: string | null
          label?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          token?: string
          contact_id?: string | null
          company_id?: string | null
          campaign_id?: string | null
          created_by?: string | null
          label?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          id: string
          organization_id: string
          booking_link_id: string | null
          contact_id: string | null
          company_id: string | null
          host_user_id: string | null
          title: string
          scheduled_start: string
          scheduled_end: string
          timezone: string
          attendee_name: string
          attendee_email: string
          status: MeetingStatus
          confirmation_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          booking_link_id?: string | null
          contact_id?: string | null
          company_id?: string | null
          host_user_id?: string | null
          title: string
          scheduled_start: string
          scheduled_end: string
          timezone?: string
          attendee_name: string
          attendee_email: string
          status?: MeetingStatus
          confirmation_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          booking_link_id?: string | null
          contact_id?: string | null
          company_id?: string | null
          host_user_id?: string | null
          title?: string
          scheduled_start?: string
          scheduled_end?: string
          timezone?: string
          attendee_name?: string
          attendee_email?: string
          status?: MeetingStatus
          confirmation_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_briefs: {
        Row: {
          id: string
          organization_id: string
          meeting_id: string
          content: string
          sources: Json
          prompt_version: string
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          meeting_id: string
          content: string
          sources?: Json
          prompt_version?: string
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          meeting_id?: string
          content?: string
          sources?: Json
          prompt_version?: string
          generated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          contact_id: string | null
          meeting_id: string | null
          title: string
          content: string
          amount_cents: number
          currency: string
          status: ProposalStatus
          reviewed_by: string | null
          reviewed_at: string | null
          approved_at: string | null
          sent_at: string | null
          prompt_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          contact_id?: string | null
          meeting_id?: string | null
          title: string
          content: string
          amount_cents?: number
          currency?: string
          status?: ProposalStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_at?: string | null
          sent_at?: string | null
          prompt_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          contact_id?: string | null
          meeting_id?: string | null
          title?: string
          content?: string
          amount_cents?: number
          currency?: string
          status?: ProposalStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_at?: string | null
          sent_at?: string | null
          prompt_version?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          proposal_id: string
          company_id: string
          contact_id: string | null
          invoice_number: string
          amount_cents: number
          currency: string
          status: InvoiceStatus
          due_date: string
          sent_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          proposal_id: string
          company_id: string
          contact_id?: string | null
          invoice_number: string
          amount_cents: number
          currency?: string
          status?: InvoiceStatus
          due_date: string
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          proposal_id?: string
          company_id?: string
          contact_id?: string | null
          invoice_number?: string
          amount_cents?: number
          currency?: string
          status?: InvoiceStatus
          due_date?: string
          sent_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_workflows: {
        Row: {
          id: string
          organization_id: string
          company_id: string
          contact_id: string | null
          proposal_id: string
          invoice_id: string | null
          status: OnboardingStatus
          triggered_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          company_id: string
          contact_id?: string | null
          proposal_id: string
          invoice_id?: string | null
          status?: OnboardingStatus
          triggered_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          company_id?: string
          contact_id?: string | null
          proposal_id?: string
          invoice_id?: string | null
          status?: OnboardingStatus
          triggered_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ab_experiments: {
        Row: {
          id: string
          organization_id: string
          campaign_id: string | null
          name: string
          experiment_type: ExperimentType
          status: ExperimentStatus
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          campaign_id?: string | null
          name: string
          experiment_type: ExperimentType
          status?: ExperimentStatus
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          campaign_id?: string | null
          name?: string
          experiment_type?: ExperimentType
          status?: ExperimentStatus
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ab_experiment_variants: {
        Row: {
          id: string
          organization_id: string
          experiment_id: string
          label: string
          subject_pattern: string | null
          body_pattern: string | null
          send_hour: number | null
          sends_count: number
          replies_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          experiment_id: string
          label: string
          subject_pattern?: string | null
          body_pattern?: string | null
          send_hour?: number | null
          sends_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          experiment_id?: string
          label?: string
          subject_pattern?: string | null
          body_pattern?: string | null
          send_hour?: number | null
          sends_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      optimization_recommendations: {
        Row: {
          id: string
          organization_id: string
          recommendation_type: RecommendationType
          title: string
          summary: string
          payload: Json
          confidence_score: number
          status: RecommendationStatus
          icp_profile_id: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          recommendation_type: RecommendationType
          title: string
          summary: string
          payload?: Json
          confidence_score?: number
          status?: RecommendationStatus
          icp_profile_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          recommendation_type?: RecommendationType
          title?: string
          summary?: string
          payload?: Json
          confidence_score?: number
          status?: RecommendationStatus
          icp_profile_id?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_edit_feedback: {
        Row: {
          id: string
          organization_id: string
          content_type: ContentFeedbackType
          source_id: string
          original_subject: string | null
          original_body: string
          edited_subject: string | null
          edited_body: string
          editor_id: string | null
          prompt_version: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          content_type: ContentFeedbackType
          source_id: string
          original_subject?: string | null
          original_body: string
          edited_subject?: string | null
          edited_body: string
          editor_id?: string | null
          prompt_version?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          content_type?: ContentFeedbackType
          source_id?: string
          original_subject?: string | null
          original_body?: string
          edited_subject?: string | null
          edited_body?: string
          editor_id?: string | null
          prompt_version?: string
          created_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          id: string
          organization_id: string
          alert_key: string
          severity: AlertSeverity
          status: AlertStatus
          title: string
          message: string
          payload: Json
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          alert_key: string
          severity?: AlertSeverity
          status?: AlertStatus
          title: string
          message: string
          payload?: Json
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          alert_key?: string
          severity?: AlertSeverity
          status?: AlertStatus
          title?: string
          message?: string
          payload?: Json
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          id: string
          organization_id: string
          event_type: UsageEventType
          quantity: number
          metadata: Json
          recorded_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          event_type: UsageEventType
          quantity?: number
          metadata?: Json
          recorded_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          event_type?: UsageEventType
          quantity?: number
          metadata?: Json
          recorded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: {
          invite_token: string
        }
        Returns: string
      }
      get_org_role: {
        Args: {
          org_id: string
        }
        Returns: MembershipRole
      }
      is_org_admin: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      is_org_owner: {
        Args: {
          org_id: string
        }
        Returns: boolean
      }
      get_booking_link_public: {
        Args: {
          link_token: string
        }
        Returns: Json
      }
      book_meeting_public: {
        Args: {
          link_token: string
          attendee_name: string
          attendee_email: string
          scheduled_start: string
        }
        Returns: string
      }
    }
    Enums: {
      membership_role: MembershipRole
      company_status: CompanyStatus
      pipeline_job_status: PipelineJobStatus
      lead_qualification_status: LeadQualificationStatus
      email_draft_status: EmailDraftStatus
      domain_verification_status: DomainVerificationStatus
      mailbox_provider: MailboxProvider
      mailbox_status: MailboxStatus
      suppression_reason: SuppressionReason
      campaign_status: CampaignStatus
      campaign_contact_status: CampaignContactStatus
      send_record_status: SendRecordStatus
      reply_intent: ReplyIntent
      calendar_provider: CalendarProvider
      calendar_connection_status: CalendarConnectionStatus
      meeting_status: MeetingStatus
      proposal_status: ProposalStatus
      invoice_status: InvoiceStatus
      onboarding_status: OnboardingStatus
      experiment_status: ExperimentStatus
      experiment_type: ExperimentType
      recommendation_type: RecommendationType
      recommendation_status: RecommendationStatus
      content_feedback_type: ContentFeedbackType
      alert_severity: AlertSeverity
      alert_status: AlertStatus
      usage_event_type: UsageEventType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>
export type Membership = Tables<'memberships'>
export type Invitation = Tables<'invitations'>
export type AuditLog = Tables<'audit_logs'>
export type IcpProfile = Tables<'icp_profiles'>
export type Company = Tables<'companies'>
export type CompanyCrawl = Tables<'company_crawls'>
export type ResearchReportRow = Tables<'research_reports'>
export type Contact = Tables<'contacts'>
export type PipelineJob = Tables<'pipeline_jobs'>
export type OrganizationOutreachSettings = Tables<'organization_outreach_settings'>
export type EmailSequence = Tables<'email_sequences'>
export type SequenceStep = Tables<'sequence_steps'>
export type LeadScore = Tables<'lead_scores'>
export type EmailDraft = Tables<'email_drafts'>
export type OutreachDomain = Tables<'outreach_domains'>
export type Mailbox = Tables<'mailboxes'>
export type SuppressionEntry = Tables<'suppression_entries'>
export type Campaign = Tables<'campaigns'>
export type CampaignMailbox = Tables<'campaign_mailboxes'>
export type CampaignContact = Tables<'campaign_contacts'>
export type SendRecord = Tables<'send_records'>
export type InboundMessage = Tables<'inbound_messages'>
export type CalendarConnection = Tables<'calendar_connections'>
export type AvailabilitySettings = Tables<'availability_settings'>
export type BookingLink = Tables<'booking_links'>
export type Meeting = Tables<'meetings'>
export type MeetingBrief = Tables<'meeting_briefs'>
export type Proposal = Tables<'proposals'>
export type Invoice = Tables<'invoices'>
export type OnboardingWorkflow = Tables<'onboarding_workflows'>
export type AbExperiment = Tables<'ab_experiments'>
export type AbExperimentVariant = Tables<'ab_experiment_variants'>
export type OptimizationRecommendation = Tables<'optimization_recommendations'>
export type ContentEditFeedback = Tables<'content_edit_feedback'>
export type SystemAlert = Tables<'system_alerts'>
export type UsageEvent = Tables<'usage_events'>
