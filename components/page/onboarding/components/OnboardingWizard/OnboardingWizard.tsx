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
import { ExpertiseStep } from '@/components/page/onboarding/components/ExpertiseStep';
import { FormProvider, useForm } from 'react-hook-form';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';

interface Props {
  userInfo: IUserInfo;
}

export const OnboardingWizard = ({ userInfo }: Props) => {
  const { step } = useOnboardingState();

  const methods = useForm<OnboardingForm>({
    defaultValues: {},
  });
  const { handleSubmit } = methods;

  const onSubmit = (formData: OnboardingForm) => {
    console.log(formData);
  };

  return (
    <FormProvider {...methods}>
      <form className={s.root} noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className={s.content}>
          {step === 'welcome' && <WelcomeStep userInfo={userInfo} />}
          {step === 'profile' && <ProfileStep userInfo={userInfo} />}
          {step === 'contacts' && <ContactsStep userInfo={userInfo} />}
          {step === 'expertise' && <ExpertiseStep userInfo={userInfo} />}
        </div>
        <OnboardingProgress />
        <OnboardingNavigation userInfo={userInfo} />
      </form>
    </FormProvider>
  );
};
