import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState } from '@/app/actions/demo-day.actions';
import { DemodayCompletedView } from '@/components/page/demo-day/DemodayCompletedView';

export default async function CompletedPage() {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();
  const parsedUserInfo = userInfo;

  // Fetch demo day state on server side
  const demoDayResult = await getDemoDayState(parsedUserInfo.uid, authToken);

  const demoDayState = demoDayResult?.data;

  if (demoDayState?.status !== 'COMPLETED') {
    redirect('/demoday');
  }

  return <DemodayCompletedView initialDemoDayState={demoDayState} isLoggedIn={isLoggedIn} userInfo={userInfo} />;
}
