'use server'

import { ACTIVE_ORG_COOKIE } from '@atlas/shared'
import {
  createOrganizationSchema,
  inviteMemberSchema,
  signInSchema,
  signUpSchema,
  slugifyOrganizationName,
  updateOrganizationSchema,
} from '@atlas/types'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AuthActionState {
  error?: string
  success?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/onboarding')
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  const next = formData.get('next')
  redirect(typeof next === 'string' && next.startsWith('/') ? next : '/dashboard')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_ORG_COOKIE)
  redirect('/login')
}

export async function createOrganizationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = getFormString(formData, 'name')
  const slugInput = getFormString(formData, 'slug')
  const slug = slugInput.trim() || slugifyOrganizationName(name)

  const parsed = createOrganizationSchema.safeParse({ name, slug })
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .insert({ name: parsed.data.name, slug: parsed.data.slug })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, data.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function switchOrganizationAction(organizationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    throw new Error('Organization not accessible')
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  redirect('/dashboard')
}

export async function updateOrganizationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const organizationId = getFormString(formData, 'organizationId')
  const parsed = updateOrganizationSchema.safeParse({ name: getFormString(formData, 'name') })

  if (!parsed.success || !organizationId) {
    return { error: parsed.success ? 'Organization is required' : parsed.error.errors[0]?.message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .update({ name: parsed.data.name })
    .eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: 'Organization updated' }
}

export async function inviteMemberAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const organizationId = getFormString(formData, 'organizationId')
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role') ?? 'member',
  })

  if (!parsed.success || !organizationId) {
    return { error: parsed.success ? 'Organization is required' : parsed.error.errors[0]?.message }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('invitations').insert({
    organization_id: organizationId,
    email: parsed.data.email,
    role: parsed.data.role,
    invited_by: user.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/team')
  return { success: `Invitation sent to ${parsed.data.email}` }
}

export async function acceptInvitationAction(token: string): Promise<AuthActionState> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('accept_invitation', { invite_token: token })

  if (error) {
    return { error: error.message }
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, data, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function removeMemberAction(
  membershipId: string,
  organizationId: string,
): Promise<AuthActionState> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', membershipId)
    .eq('organization_id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/team')
  return { success: 'Member removed' }
}

export async function revokeInvitationAction(
  invitationId: string,
  organizationId: string,
): Promise<AuthActionState> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('organization_id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/team')
  return { success: 'Invitation revoked' }
}

export async function deleteOrganizationAction(organizationId: string): Promise<AuthActionState> {
  const supabase = await createClient()
  const { error } = await supabase.from('organizations').delete().eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_ORG_COOKIE)
  revalidatePath('/dashboard')
  redirect('/onboarding')
}
