import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewInvestorDb(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.INVESTOR_DB.PERM_VIEW);
}
