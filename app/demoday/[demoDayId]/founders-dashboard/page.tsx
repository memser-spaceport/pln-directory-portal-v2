import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState } from '@/app/actions/demo-day.actions';
import { FoundersDashboardView } from '@/components/page/demo-day/FoundersDashboardView';

export default async function FoundersDashboardPage({ params }: { params: { demoDayId: string } }) {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();

  // Fetch demo day state on server side
  const demoDayResult = await getDemoDayState(params.demoDayId, userInfo.uid, authToken);

  const demoDayState = demoDayResult?.data;

  if (demoDayState?.access !== 'FOUNDER') {
    redirect(`/demoday/${params.demoDayId}`);
  }

  return <FoundersDashboardView demoDayState={demoDayState} userInfo={userInfo} />;
}
