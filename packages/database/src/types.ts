/** Database types — keep in sync with supabase/migrations; regenerate via pnpm db:types when Supabase CLI is available. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MembershipRole = 'owner' | 'admin' | 'member'
export type CompanyStatus = 'discovered' | 'crawling' | 'researching' | 'researched' | 'failed'
export type PipelineJobStatus = 'pending' | 'running' | 'completed' | 'failed'

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
    }
    Enums: {
      membership_role: MembershipRole
      company_status: CompanyStatus
      pipeline_job_status: PipelineJobStatus
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
