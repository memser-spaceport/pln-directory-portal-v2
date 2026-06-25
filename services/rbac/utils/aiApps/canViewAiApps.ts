import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewAiApps(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.AI_APPS.PERM_VIEW);
}
