import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewFounderGuide(permissions: string[]) {
  return permissions.some((p) => p.startsWith(PERMISSIONS.FOUNDER_GUIDE.PERM_VIEW));
}
