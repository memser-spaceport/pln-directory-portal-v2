import { IUserInfo } from '@/types/shared.types';
import { useCurrentUserStore } from '@/services/auth/store';

export function isTierUser(userInfo?: IUserInfo) {
  const user = useCurrentUserStore.getState().currentUser;
  return user?.rbac?.effectivePermissions.some((p) => p.code === 'team.priority.read');
}
