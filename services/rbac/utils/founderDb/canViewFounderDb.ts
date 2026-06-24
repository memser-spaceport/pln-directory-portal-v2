import { PERMISSIONS } from '@/services/rbac/constants';
import { FOUNDER_DB_ENABLED } from '@/services/founders/constants';

export function canViewFounderDb(perms: Set<string>) {
  return (
    FOUNDER_DB_ENABLED &&
    (perms.has(PERMISSIONS.FOUNDER_DB.PERM_VIEW) || perms.has(PERMISSIONS.FOUNDER_DB.PERM_EDIT))
  );
}
