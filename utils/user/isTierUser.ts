import { IUserInfo } from '@/types/shared.types';

export function isTierUser(userInfo?: IUserInfo) {
  return !!userInfo?.isTierViewer;
}
