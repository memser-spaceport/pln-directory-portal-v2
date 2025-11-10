import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { redirect } from 'next/navigation';
import { ActiveView } from '@/components/page/demo-day/ActiveView';

export default async function ActivePage() {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();
  const parsedUserInfo: IUserInfo = userInfo;

  // Fetch demo day state on the server side
  let demoDayState = null;

  if (!isLoggedIn || !parsedUserInfo?.uid) {
    redirect('/demoday');
  }

  if (parsedUserInfo?.uid) {
    try {
      const demoDayResult = await getDemoDayState(parsedUserInfo.uid, authToken);

      demoDayState = demoDayResult?.data || null;
    } catch (error) {
      console.error('Error fetching demo day data:', error);
    }
  }

  // Server-side redirect logic
  if (demoDayState) {
    if (demoDayState.access === 'none' || demoDayState.status !== 'ACTIVE') {
      redirect('/demoday');
    }
  }

  return <ActiveView initialDemoDayState={demoDayState || undefined} />;
}
