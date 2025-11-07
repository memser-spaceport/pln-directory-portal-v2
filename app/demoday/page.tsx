import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState, getMemberInfo } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { redirect } from 'next/navigation';
import { Landing } from '@/components/page/demo-day/Landing';

export default async function Page() {
  const { userInfo, authToken } = getCookiesFromHeaders();
  const parsedUserInfo: IUserInfo = userInfo;

  // Fetch initial data on the server side
  let demoDayState = null;
  let memberData = null;

  try {
    const [demoDayResult, memberResult] = await Promise.all([
      getDemoDayState(parsedUserInfo.uid, authToken),
      parsedUserInfo.uid ? getMemberInfo(parsedUserInfo.uid, authToken) : null,
    ]);

    demoDayState = demoDayResult?.data || null;
    memberData = memberResult?.data || null;
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }

  // Server-side redirect logic (moved from client component)
  if (demoDayState) {
    if (demoDayState.status === 'COMPLETED') {
      redirect('/demoday/completed');
    }

    // Conditions that should redirect to /members
    if (demoDayState.access === 'none' && demoDayState.status === 'NONE') {
      redirect('/members');
    }

    if ((demoDayState.access === 'FOUNDER' || demoDayState.access === 'INVESTOR') && demoDayState.status === 'NONE') {
      redirect('/members');
    }

    // Conditions that should redirect to specific routes
    if (demoDayState.access === 'FOUNDER' && demoDayState.status === 'UPCOMING') {
      redirect('/demoday/founder');
    }

    if (demoDayState.access === 'INVESTOR' && demoDayState.status === 'UPCOMING') {
      redirect('/demoday/investor');
    }

    if (demoDayState.access === 'FOUNDER' && demoDayState.status === 'ACTIVE') {
      redirect('/demoday/active');
    }

    if (demoDayState.access === 'INVESTOR' && demoDayState.status === 'ACTIVE') {
      const isInvestorProfileComplete = checkInvestorProfileComplete(memberData, parsedUserInfo);
      if (isInvestorProfileComplete) {
        redirect('/demoday/active');
      } else {
        redirect('/demoday/investor');
      }
    }
  }

  return <Landing initialDemoDayState={demoDayState || undefined} />;
}
