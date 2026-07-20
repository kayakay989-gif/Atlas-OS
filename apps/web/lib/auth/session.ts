import { ACTIVE_ORG_COOKIE } from '@atlas/shared'
import type { MembershipRole, Organization, Profile } from '@atlas/database/types'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface OrganizationMembership {
  organization: Organization
  role: MembershipRole
}

export interface SessionContext {
  user: { id: string; email: string }
  profile: Profile | null
  memberships: OrganizationMembership[]
  activeOrganization: Organization | null
  activeRole: MembershipRole | null
}

export async function requireUser(): Promise<SessionContext['user']> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/login')
  }

  return { id: user.id, email: user.email }
}

export async function getSessionContext(): Promise<SessionContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: memberships } = await supabase
    .from('memberships')
    .select(
      `
      role,
      organization:organizations (
        id,
        name,
        slug,
        created_at,
        updated_at
      )
    `,
    )
    .eq('user_id', user.id)

  const organizationMemberships: OrganizationMembership[] =
    memberships
      ?.map((row) => {
        const organization = row.organization as Organization | null
        if (!organization) return null
        return { organization, role: row.role }
      })
      .filter((item): item is OrganizationMembership => item !== null) ?? []

  const cookieStore = await cookies()
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value
  const activeMembership =
    organizationMemberships.find((item) => item.organization.id === activeOrgId) ??
    organizationMemberships[0] ??
    null

  return {
    user: { id: user.id, email: user.email },
    profile: profile ?? null,
    memberships: organizationMemberships,
    activeOrganization: activeMembership?.organization ?? null,
    activeRole: activeMembership?.role ?? null,
  }
}

export async function requireOrganizationContext(): Promise<
  SessionContext & { activeOrganization: Organization; activeRole: MembershipRole }
> {
  const context = await getSessionContext()

  if (!context.activeOrganization || !context.activeRole) {
    redirect('/onboarding')
  }

  return {
    ...context,
    activeOrganization: context.activeOrganization,
    activeRole: context.activeRole,
  }
}
