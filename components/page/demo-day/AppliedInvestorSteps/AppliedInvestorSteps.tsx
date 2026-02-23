'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import clsx from 'clsx';

import { getParsedValue } from '@/utils/common.utils';
import { checkInvestorProfileComplete } from '@/utils/member.utils';
import { useMember } from '@/services/members/hooks/useMember';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import { EditInvestorProfileDrawer } from './EditInvestorProfileDrawer/EditInvestorProfileDrawer';
import s from './AppliedInvestorSteps.module.scss';

interface Props {
  isNew: boolean;
  isLoggedIn: boolean;
  uid: string;
  email?: string;
  demoDaySlug: string;
}

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M14.847 2.90307L12.597 0.653073C12.5186 0.574413 12.4254 0.512 12.3229 0.469414C12.2203 0.426829 12.1103 0.404907 11.9993 0.404907C11.8882 0.404907 11.7783 0.426829 11.6757 0.469414C11.5732 0.512 11.48 0.574413 11.4016 0.653073L4.65164 7.40307C4.49396 7.56167 4.4057 7.77638 4.40625 8.00003V10.25C4.40625 10.4738 4.49514 10.6884 4.65338 10.8466C4.81161 11.0049 5.02622 11.0938 5.25 11.0938H7.5C7.61084 11.0939 7.7206 11.0721 7.82303 11.0298C7.92546 10.9874 8.01854 10.9253 8.09695 10.847L14.847 4.09698C14.9254 4.01862 14.9876 3.92556 15.0301 3.82313C15.0726 3.7207 15.0944 3.61091 15.0944 3.50003C15.0944 3.38914 15.0726 3.27935 15.0301 3.17692C14.9876 3.07449 14.9254 2.98143 14.847 2.90307ZM12 2.44534L13.0547 3.50003L12.2812 4.27346L11.2266 3.21878L12 2.44534ZM7.14844 9.40628H6.09375V8.35159L10.0312 4.41409L11.0859 5.46878L7.14844 9.40628ZM14.5312 8.32135V13.625C14.5312 13.998 14.3831 14.3557 14.1194 14.6194C13.8556 14.8831 13.498 15.0313 13.125 15.0313H1.875C1.50204 15.0313 1.14435 14.8831 0.880631 14.6194C0.616908 14.3557 0.46875 13.998 0.46875 13.625V2.37503C0.46875 2.00206 0.616908 1.64438 0.880631 1.38066C1.14435 1.11693 1.50204 0.968776 1.875 0.968776H7.17867C7.40245 0.968776 7.61706 1.05767 7.77529 1.2159C7.93353 1.37414 8.02242 1.58875 8.02242 1.81253C8.02242 2.0363 7.93353 2.25091 7.77529 2.40915C7.61706 2.56738 7.40245 2.65628 7.17867 2.65628H2.15625V13.3438H12.8438V8.32135C12.8438 8.09758 12.9326 7.88297 13.0909 7.72473C13.2491 7.5665 13.4637 7.4776 13.6875 7.4776C13.9113 7.4776 14.1259 7.5665 14.2841 7.72473C14.4424 7.88297 14.5312 8.09758 14.5312 8.32135Z"
      fill="currentColor"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3334 4L6.00008 11.3333L2.66675 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckboxIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 0C10.4288 0 7.91543 0.762437 5.77759 2.1909C3.63975 3.61935 1.97351 5.64968 0.989572 8.02512C0.0056327 10.4006 -0.251811 13.0144 0.249797 15.5362C0.751405 18.0579 1.98953 20.3743 3.80762 22.1924C5.6257 24.0105 7.94208 25.2486 10.4638 25.7502C12.9856 26.2518 15.5995 25.9944 17.9749 25.0104C20.3503 24.0265 22.3807 22.3603 23.8091 20.2224C25.2376 18.0846 26 15.5712 26 13C25.9964 9.5533 24.6256 6.24882 22.1884 3.81163C19.7512 1.37445 16.4467 0.00363977 13 0ZM18.7075 10.7075L11.7075 17.7075C11.6146 17.8005 11.5043 17.8742 11.3829 17.9246C11.2615 17.9749 11.1314 18.0008 11 18.0008C10.8686 18.0008 10.7385 17.9749 10.6171 17.9246C10.4957 17.8742 10.3854 17.8005 10.2925 17.7075L7.29251 14.7075C7.10486 14.5199 6.99945 14.2654 6.99945 14C6.99945 13.7346 7.10486 13.4801 7.29251 13.2925C7.48015 13.1049 7.73464 12.9994 8.00001 12.9994C8.26537 12.9994 8.51987 13.1049 8.70751 13.2925L11 15.5863L17.2925 9.2925C17.3854 9.19959 17.4957 9.12589 17.6171 9.07561C17.7385 9.02532 17.8686 8.99944 18 8.99944C18.1314 8.99944 18.2615 9.02532 18.3829 9.07561C18.5043 9.12589 18.6146 9.19959 18.7075 9.2925C18.8004 9.38541 18.8741 9.49571 18.9244 9.6171C18.9747 9.7385 19.0006 9.86861 19.0006 10C19.0006 10.1314 18.9747 10.2615 18.9244 10.3829C18.8741 10.5043 18.8004 10.6146 18.7075 10.7075Z"
      fill="#1B4DFF"
    />
  </svg>
);

export const AppliedInvestorSteps: React.FC<Props> = ({ isNew, isLoggedIn, uid, email, demoDaySlug }) => {
  const router = useRouter();
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const { data: memberData } = useMember(isLoggedIn ? uid : undefined);
  const { onAccountCreatedSuccessModalContinueToLoginClicked } = useDemoDayAnalytics();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isInvestorProfileComplete = useMemo(
    () => checkInvestorProfileComplete(memberData?.memberInfo, userInfo),
    [memberData?.memberInfo, userInfo],
  );

  const demoDayPath = `/demoday/${demoDaySlug}`;

  const handleProfileCta = () => {
    onAccountCreatedSuccessModalContinueToLoginClicked({
      isNew,
      memberUid: uid,
      email,
      demoDaySlug,
      demoDayTitle: undefined,
    });

    if (isLoggedIn) {
      setDrawerOpen(true);
    } else {
      router.replace(`${demoDayPath}?prefillEmail=${encodeURIComponent(email ?? '')}#login`);
    }
  };

  const step1Status = isInvestorProfileComplete ? 'completed' : 'current';
  const step1Title = isNew ? 'Set up investor profile' : 'Review your investor profile (optional)';
  const step1Description = isNew
    ? "Complete your investor profile: founders see this when you're introduced."
    : "Keep your information up-to-date; founders see this when you're introduced.";

  const step2Status = isInvestorProfileComplete ? 'current' : 'pending';

  const ctaLabel = isInvestorProfileComplete
    ? 'Go to Investor Profile'
    : `${!isLoggedIn ? 'Log In To ' : ''}${isNew ? 'Set Up Investor Profile' : 'Review Investor Profile'}`;
  const step1ButtonClass = step1Status === 'completed' ? s.secondaryButton : s.primaryButton;

  const steps = [
    {
      id: 0,
      status: 'completed',
      title: 'Application submitted successfully!',
      description: 'Our team will review your application shortly.',
      height: 52,
    },
    {
      id: 1,
      status: step1Status,
      title: step1Title,
      description: step1Description,
      height: 116,
      children: (
        <button type="button" className={step1ButtonClass} onClick={handleProfileCta}>
          {!!isLoggedIn && <EditIcon />} {ctaLabel}
        </button>
      ),
    },
    {
      id: 2,
      status: step2Status,
      title: 'Await approval confirmation',
      description: "You'll receive an email confirmation if our team approves your Demo Day application.",
      height: 52,
    },
  ];

  return (
    <>
    <div className={s.stepperCard}>
      <div className={s.titleSection}>
        <div className={s.icon}>
          <CheckboxIcon />
        </div>
      </div>

      <div className={s.verticalStepper}>
        {steps.map((step, index) => (
          <div key={step.id} className={clsx(s.stepContainer, s[step.status])}>
            <div className={s.stepIndicatorContainer}>
              <div className={clsx(s.stepIndicator, s[step.status])}>
                {step.status === 'completed' ? (
                  <div className={s.stepIconCompleted}>
                    <CheckIcon />
                  </div>
                ) : (
                  <div className={s.stepDot} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={clsx(s.stepConnector, step.status === 'completed' && s.completed)}
                  style={{ height: step.height }}
                />
              )}
            </div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>{step.title}</div>
              <div className={s.stepDescription}>{step.description}</div>
              {step.children}
            </div>
          </div>
        ))}
      </div>
    </div>
    <EditInvestorProfileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} uid={uid} isLoggedIn={isLoggedIn} />
    </>
  );
};
