import { describe, expect, it } from 'vitest'
import { ROLES } from './constants'
import { canDeleteOrganization, canManageMemberRole, canManageMembers } from './auth'

describe('rbac helpers', () => {
  it('allows owners and admins to manage members', () => {
    expect(canManageMembers(ROLES.OWNER)).toBe(true)
    expect(canManageMembers(ROLES.ADMIN)).toBe(true)
    expect(canManageMembers(ROLES.MEMBER)).toBe(false)
  })

  it('allows only owners to delete organizations', () => {
    expect(canDeleteOrganization(ROLES.OWNER)).toBe(true)
    expect(canDeleteOrganization(ROLES.ADMIN)).toBe(false)
  })

  it('restricts role changes based on actor role', () => {
    expect(canManageMemberRole(ROLES.OWNER, ROLES.ADMIN)).toBe(true)
    expect(canManageMemberRole(ROLES.OWNER, ROLES.OWNER)).toBe(false)
    expect(canManageMemberRole(ROLES.ADMIN, ROLES.MEMBER)).toBe(true)
    expect(canManageMemberRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false)
    expect(canManageMemberRole(ROLES.MEMBER, ROLES.MEMBER)).toBe(false)
  })
})
