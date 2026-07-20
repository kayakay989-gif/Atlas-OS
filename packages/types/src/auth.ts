import { z } from 'zod'

export const membershipRoleSchema = z.enum(['owner', 'admin', 'member'])
export type MembershipRole = z.infer<typeof membershipRoleSchema>

export const inviteRoleSchema = z.enum(['admin', 'member'])

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(120),
})

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export type SignInInput = z.infer<typeof signInSchema>

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: inviteRoleSchema.default('member'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

export function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}
