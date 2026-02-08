// Role-based permissions for Cadence CRM

export type UserRole = 'admin' | 'member'

export interface Permissions {
  // Pages
  canAccessReports: boolean
  canAccessAutomations: boolean
  
  // Settings tabs
  canAccessBilling: boolean
  canEditOrganization: boolean
  
  // Team management
  canInviteMembers: boolean
  canEditMembers: boolean
  canRemoveMembers: boolean
}

export function getPermissions(role: UserRole): Permissions {
  if (role === 'admin') {
    return {
      canAccessReports: true,
      canAccessAutomations: true,
      canAccessBilling: true,
      canEditOrganization: true,
      canInviteMembers: true,
      canEditMembers: true,
      canRemoveMembers: true,
    }
  }
  
  // Member permissions
  return {
    canAccessReports: false,
    canAccessAutomations: false,
    canAccessBilling: false,
    canEditOrganization: false,
    canInviteMembers: false,
    canEditMembers: false,
    canRemoveMembers: false,
  }
}

// Pages that require admin access
export const ADMIN_ONLY_PAGES = ['/reports', '/automations']

// Check if a path requires admin access
export function requiresAdminAccess(pathname: string): boolean {
  return ADMIN_ONLY_PAGES.some(page => pathname.startsWith(page))
}
