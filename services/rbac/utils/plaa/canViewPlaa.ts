import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewPlaa(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.PLAA.PERM_ACCESS);
}
