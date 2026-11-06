import { IUserInfo } from '@/types/shared.types';

export function isAdminUser(userInfo?: IUserInfo | null) {
  return !!userInfo?.rbac?.effectivePermissions?.some((p) => p.code === 'directory.admin.full');
}
