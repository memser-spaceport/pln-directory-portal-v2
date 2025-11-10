import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { IUserInfo } from '@/types/shared.types';

export default async function Page() {
  const { userInfo, authToken } = getCookiesFromHeaders();
  const parsedUserInfo: IUserInfo = userInfo;

  return <div>main page list of all demo days</div>;
}
