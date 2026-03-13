import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';

export function isAdminUser(userInfo?: IUserInfo | null) {
  return !!userInfo?.roles?.includes(ADMIN_ROLE);
}
