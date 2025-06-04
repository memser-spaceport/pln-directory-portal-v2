import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

import { AuthTrigger } from '@/components/page/onboarding/components/AuthTrigger';
import { OnboardingWizard } from '@/components/page/onboarding/components/OnboardingWizard';

import s from './page.module.scss';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const OnboardingPage = async ({ searchParams }: Props) => {
  const { name, isLoggedIn, userInfo } = await getPageData(searchParams);

  return (
    <>
      <OnboardingWizard userInfo={userInfo} />
      <AuthTrigger isLoggedIn={isLoggedIn} />
    </>
  );
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

// http://localhost:4200/members/onboarding?loginFlow=onboarding&prefillEmail=olegverzunov@gmail.com
