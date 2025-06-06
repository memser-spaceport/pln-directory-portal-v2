import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

import { OnboardingWizard } from '@/components/page/onboarding/components/OnboardingWizard';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const OnboardingPage = async ({ searchParams }: Props) => {
  const { isLoggedIn, userInfo } = await getPageData(searchParams);

  return <OnboardingWizard userInfo={userInfo} isLoggedIn={isLoggedIn} />;
};

export default OnboardingPage;

async function getPageData(searchParams: Props['searchParams']) {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  return {
    name: 'some name from param',
    isLoggedIn,
    userInfo,
  };
}
