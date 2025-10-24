import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState, getMemberInfo } from '@/app/actions/demo-day.actions';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { InvestorPendingView } from '@/components/page/demo-day/InvestorPendingView';

export default async function InvestorPage() {
  const { userInfo, authToken, isLoggedIn } = getCookiesFromHeaders();
  const parsedUserInfo = userInfo;

  if (!isLoggedIn || !parsedUserInfo?.uid) {
    redirect('/demoday');
  }

  // Fetch demo day state on server side
  const demoDayResult = await getDemoDayState(parsedUserInfo.uid, authToken);

  if (demoDayResult?.isError) {
    redirect('/demoday');
  }

  const demoDayState = demoDayResult?.data;

  if (!demoDayState) {
    redirect('/demoday');
  }

  if (demoDayState.access !== 'INVESTOR') {
    redirect('/demoday');
  }

  if (demoDayState.status === 'NONE' || demoDayState.status === 'COMPLETED') {
    redirect('/demoday');
  }

  let memberResult = null;

  // Server-side redirect logic for completed investor profiles when demo day is active
  if (demoDayState.status === 'ACTIVE') {
    memberResult = await getMemberInfo(parsedUserInfo.uid, authToken);

    if (!memberResult?.isError && memberResult?.data) {
      const isInvestorProfileComplete = checkInvestorProfileComplete(memberResult.data, parsedUserInfo);
      if (isInvestorProfileComplete) {
        redirect('/demoday/active');
      }
    }
  }

  return <InvestorPendingView initialDemoDayState={demoDayState} initialMemberData={memberResult?.data} />;
}
