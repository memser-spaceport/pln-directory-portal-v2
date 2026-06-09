import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState } from '@/app/actions/demo-day.actions';
import { DemodayCompletedView } from '@/components/page/demo-day/DemodayCompletedView';

export default async function CompletedPage(props: { params: Promise<{ demoDayId: string }> }) {
  const params = await props.params;
  const { userInfo, authToken, isLoggedIn } = await getCookiesFromHeaders();
  const parsedUserInfo = userInfo;

  // Fetch demo day state on server side
  const demoDayResult = await getDemoDayState(params.demoDayId, parsedUserInfo.uid, authToken);

  const demoDayState = demoDayResult?.data;

  if (demoDayState?.status !== 'COMPLETED') {
    redirect(`/demoday/${params.demoDayId}`);
  }

  return <DemodayCompletedView initialDemoDayState={demoDayState} isLoggedIn={isLoggedIn} userInfo={userInfo} />;
}
