import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

export function isAdminUser(userInfo?: IUserInfo | null) {
  const hasAdminPermissions = !!userInfo?.rbac?.effectivePermissions.some((p) => p.code === 'directory.admin.full');
  return !!userInfo?.roles?.includes(ADMIN_ROLE) || hasAdminPermissions;
}
