import React, { useMemo } from 'react';
import s from './InvestorPendingView.module.scss';
import { useRouter } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useMember } from '@/services/members/hooks/useMember';
import { InvestorStepper } from './components/InvestorStepper';
import { CountdownComponent } from '@/components/common/Countdown';

export const InvestorPendingView = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const router = useRouter();
  const { data } = useGetDemoDayState();
  const { data: memberData } = useMember(userInfo?.uid);

  // Function to check if investor profile is complete
  const isInvestorProfileComplete = useMemo(() => {
    if (!memberData?.memberInfo?.investorProfile) {
      return false;
    }

    const { investorProfile } = memberData.memberInfo;

    // Check if all required fields are populated
    const hasInvestmentFocus = investorProfile.investmentFocus && investorProfile.investmentFocus.length > 0;
    const hasTypicalCheckSize = investorProfile.typicalCheckSize && investorProfile.typicalCheckSize > 0;
    const hasSecRulesAccepted = investorProfile.secRulesAccepted === true;

    return hasInvestmentFocus && hasTypicalCheckSize && hasSecRulesAccepted;
  }, [memberData]);

  // Determine current step based on profile completion
  const currentStep = useMemo(() => {
    // Step 1: Invitation accepted (default - user is on the page)
    // Step 2: Complete investor profile (if profile is not complete)
    // Step 3: Demo Day access (if profile is complete)

    if (isInvestorProfileComplete) {
      return 3; // Profile complete, ready for Demo Day
    } else {
      return 2; // Need to complete profile
    }
  }, [isInvestorProfileComplete]);

  const handleFillProfile = () => {
    if (!userInfo) {
      return;
    }

    router.push(`/members/${userInfo.uid}`);
  };



  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        {/* Main content */}
        <div className={s.content}>
          <div className={s.mainContent}>
            {/* Countdown section */}
            <div className={s.countdownSection}>
              <CountdownComponent targetDate={data?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
            </div>

            {/* Headline section */}
            <div className={s.headline}>
              <h1 className={s.title}>{data?.title || 'PL Demo Day'}</h1>
              <p className={s.description}>
                {data?.description ||
                  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
              </p>
            </div>
          </div>

          <InvestorStepper currentStep={currentStep} onFillProfile={handleFillProfile} />
        </div>
      </div>
    </div>
  );
};
