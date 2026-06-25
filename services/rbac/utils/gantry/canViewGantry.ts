import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewGantry(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.GANTRY.PERM_ADMIN) || permissions.has(PERMISSIONS.GANTRY.PERM_VIEW);
}
