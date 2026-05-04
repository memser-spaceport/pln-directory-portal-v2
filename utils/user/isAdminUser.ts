import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

export function isAdminUser(userInfo?: IUserInfo | null) {
  return !!userInfo?.rbac?.effectivePermissions.some((p) => p.code === 'directory.admin.full');
}
