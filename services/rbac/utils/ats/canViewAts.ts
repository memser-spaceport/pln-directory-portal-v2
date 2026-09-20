import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewAts(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.ATS.PERM_USER);
}
