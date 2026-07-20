import { ROLES, type Role } from './constants'

export const AUTH_EVENT_TYPES = {
  USER_SIGNED_UP: 'user.signed_up',
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_OUT: 'user.signed_out',
  ORGANIZATION_CREATED: 'organization.created',
  MEMBERSHIP_CREATED: 'membership.created',
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
} as const

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[keyof typeof AUTH_EVENT_TYPES]

export const ACTIVE_ORG_COOKIE = 'atlas_active_org_id' as const

export function canManageMembers(role: Role): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN
}

export function canDeleteOrganization(role: Role): boolean {
  return role === ROLES.OWNER
}

export function canManageMemberRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === ROLES.OWNER) {
    return targetRole !== ROLES.OWNER
  }
  if (actorRole === ROLES.ADMIN) {
    return targetRole === ROLES.MEMBER
  }
  return false
}
