// Role guard utilities
export const INTERNAL_ROLES = ['housing_admin', 'housing_manager', 'housing_staff'];
export const ADMIN_ROLES = ['housing_admin'];
export const MANAGER_ROLES = ['housing_admin', 'housing_manager'];
export const ALL_INTERNAL = ['housing_admin', 'housing_manager', 'housing_staff'];

export function canAccess(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

export function isInternalRole(role) {
  return INTERNAL_ROLES.includes(role);
}