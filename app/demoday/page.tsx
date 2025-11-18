import { DemoDayListPage } from '@/components/page/demo-day/DemoDayListPage';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

export default async function Page() {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();
  return <DemoDayListPage isLoggedIn={isLoggedIn} userInfo={userInfo} />;
}
