import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState } from '@/app/actions/demo-day.actions';
import { DemodayCompletedView } from '@/components/page/demo-day/DemodayCompletedView';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';

export default async function CompletedPage({ params }: { params: { demoDayId: string } }) {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();
  const parsedUserInfo = userInfo;

  // Fetch demo day state on server side
  const demoDayResult = await getDemoDayState(params.demoDayId, parsedUserInfo.uid, authToken);

  const demoDayState = demoDayResult?.data;

  if (demoDayState?.status !== 'COMPLETED') {
    redirect(`/demoday/${params.demoDayId}`);
  }

  return (
    <Suspense fallback={<DemoDayPageSkeleton />}>
      <DemodayCompletedView initialDemoDayState={demoDayState} isLoggedIn={isLoggedIn} userInfo={userInfo} />
    </Suspense>
  );
}
