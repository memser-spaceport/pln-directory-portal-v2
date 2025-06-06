'use client';

import React from 'react';
import { useOnboardingState } from '@/services/onboarding/store';
import { OnboardingProgress } from '@/components/page/onboarding/components/OnboardingProgress';
import { OnboardingNavigation } from '@/components/page/onboarding/components/OnboardingNavigation';

import s from './OnboardingWizard.module.scss';
import { IUserInfo } from '@/types/shared.types';
import { WelcomeStep } from '@/components/page/onboarding/components/WelcomeStep';
import { ProfileStep } from '@/components/page/onboarding/components/ProfileStep';
import { ContactsStep } from '@/components/page/onboarding/components/ContactsStep';
import { FormProvider, useForm } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Illustration from '@/components/page/onboarding/components/Illustartion/Illustration';
import { yupResolver } from '@hookform/resolvers/yup';
import { onboardingSchema } from '@/components/page/onboarding/components/OnboardingWizard/helpers';
import { AppLogo } from '@/components/page/onboarding/components/AppLogo';
import { clsx } from 'clsx';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export const OnboardingWizard = ({ userInfo, isLoggedIn }: Props) => {
  const { step } = useOnboardingState();
  const router = useRouter();

  const methods = useForm<OnboardingForm>({
    defaultValues: {
      name: userInfo.name,
      email: userInfo.email,
      officeHours: '',
      image: null,
      telegram: '',
    },
    mode: 'all',
    resolver: yupResolver(onboardingSchema),
  });
  const { handleSubmit } = methods;

  const onSubmit = (formData: OnboardingForm) => {
    console.log(formData);
  };

  return (
    <div className={s.modal}>
      <div className={s.modalContent}>
        {step !== 'welcome' && <AppLogo className={s.logo} />}
        <button
          type="button"
          className={s.closeButton}
          onClick={() => {
            router.replace(`${window.location.pathname}`);
          }}
        >
          <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
        </button>
        {step === 'welcome' && (
          <div className={s.illustration}>
            <Illustration />
          </div>
        )}

        <FormProvider {...methods}>
          <form
            className={clsx(s.root, {
              [s.isWelcomeStep]: step === 'welcome',
            })}
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className={s.content}>
              {step === 'welcome' && <WelcomeStep userInfo={userInfo} />}
              {step === 'profile' && <ProfileStep userInfo={userInfo} />}
              {step === 'contacts' && <ContactsStep userInfo={userInfo} />}
              {/*{step === 'expertise' && <ExpertiseStep userInfo={userInfo} />}*/}
            </div>
            <OnboardingProgress />
            <OnboardingNavigation userInfo={userInfo} />
          </form>
        </FormProvider>
      </div>
    </div>
  );
};
