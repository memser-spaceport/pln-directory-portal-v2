import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getDemoDayState, getMemberInfo } from '@/app/actions/demo-day.actions';
import { IUserInfo } from '@/types/shared.types';
import { redirect } from 'next/navigation';
import { checkInvestorProfileComplete, isDemoDayParticipantInvestor } from '@/utils/member.utils';
import { Landing } from '@/components/page/demo-day/Landing';

export default async function DemoDayLandingPage({ params }: { params: { demoDayId: string } }) {
  const { userInfo, authToken } = getCookiesFromHeaders();
  const parsedUserInfo: IUserInfo = userInfo;

  // Fetch initial data on the server side
  let demoDayState = null;
  let memberData = null;

  try {
    const [demoDayResult, memberResult] = await Promise.all([
      getDemoDayState(params.demoDayId, parsedUserInfo.uid, authToken),
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
      console.log('Redirecting to completed page');
      redirect(`/demoday/${params.demoDayId}/completed`);
    }

    // Conditions that should redirect to /members
    if (demoDayState.access === 'none' && demoDayState.status === 'NONE') {
      redirect('/members');
    }

    if (
      (demoDayState.access === 'FOUNDER' || isDemoDayParticipantInvestor(demoDayState.access)) &&
      demoDayState.status === 'NONE'
    ) {
      redirect('/members');
    }

    // Conditions that should redirect to specific routes
    if (
      demoDayState.access === 'FOUNDER' &&
      (demoDayState.status === 'UPCOMING' || demoDayState.status === 'REGISTRATION_OPEN')
    ) {
      redirect(`/demoday/${params.demoDayId}/founder`);
    }

    if (
      isDemoDayParticipantInvestor(demoDayState.access) &&
      (demoDayState.status === 'UPCOMING' || demoDayState.status === 'REGISTRATION_OPEN')
    ) {
      redirect(`/demoday/${params.demoDayId}/investor`);
    }

    if (demoDayState.access === 'FOUNDER' && demoDayState.status === 'ACTIVE') {
      redirect(`/demoday/${params.demoDayId}/active`);
    }

    if (isDemoDayParticipantInvestor(demoDayState.access) && demoDayState.status === 'ACTIVE') {
      const isInvestorProfileComplete = checkInvestorProfileComplete(memberData, parsedUserInfo);
      if (isInvestorProfileComplete) {
        redirect(`/demoday/${params.demoDayId}/active`);
      } else {
        redirect(`/demoday/${params.demoDayId}/investor`);
      }
    }
  }

  return <Landing initialDemoDayState={demoDayState || undefined} />;
}
