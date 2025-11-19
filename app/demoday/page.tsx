import { DemoDayListPage } from '@/components/page/demo-day/DemoDayListPage';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMemberInfo } from '@/app/actions/demo-day.actions';

export default async function Page() {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();

  let memberData = null;
  if (isLoggedIn && userInfo?.uid) {
    const memberResponse = await getMemberInfo(userInfo.uid, authToken);
    if (!memberResponse.isError) {
      memberData = memberResponse;
    }
  }

  return <DemoDayListPage isLoggedIn={isLoggedIn} userInfo={userInfo} memberData={memberData?.data} />;
}
