'use client';

import { clsx } from 'clsx';
import Image from 'next/image';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

import { IUserInfo } from '@/types/shared.types';
import { OnboardingForm } from '@/components/page/onboarding/components/OnboardingWizard/types';

import { saveRegistrationImage } from '@/services/registration.service';
import { buildMemberUpdatePayload } from '@/utils/member/buildMemberUpdatePayload';
import { onboardingSchema } from '@/components/page/onboarding/components/OnboardingWizard/helpers';

import { useOnboardingState } from '@/services/onboarding/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';

import { AppLogo } from '@/components/page/onboarding/components/AppLogo';
import { WelcomeStep } from '@/components/page/onboarding/components/WelcomeStep';
import { ProfileStep } from '@/components/page/onboarding/components/ProfileStep';
import { ContactsStep } from '@/components/page/onboarding/components/ContactsStep';
import Illustration from '@/components/page/onboarding/components/Illustartion/Illustration';
import { OnboardingProgress } from '@/components/page/onboarding/components/OnboardingProgress';
import { OnboardingNavigation } from '@/components/page/onboarding/components/OnboardingNavigation';

import s from './OnboardingWizard.module.scss';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  memberData:
    | {
        isError: boolean;
        memberInfo?: undefined;
      }
    | {
        memberInfo: any;
        isError?: undefined;
      };
}

export const OnboardingWizard = ({ userInfo, memberData }: Props) => {
  const { step } = useOnboardingState();
  const router = useRouter();
  const { mutateAsync } = useUpdateMember();
  const { onOnboardingWizardOpen, onOnboardingWizardClose, onOnboardingWizardComplete } = useMemberAnalytics();

  const methods = useForm<OnboardingForm>({
    defaultValues: {
      name: memberData?.memberInfo?.name || '',
      email: memberData?.memberInfo?.email || '',
      officeHours: memberData?.memberInfo?.officeHours || '',
      image: null,
      telegram: memberData?.memberInfo?.telegramHandler || '',
    },
    mode: 'all',
    resolver: yupResolver(onboardingSchema),
  });
  const { handleSubmit } = methods;

  const onSubmit = async (formData: OnboardingForm) => {
    if (!memberData) {
      return;
    }

    let image;

    if (formData.image) {
      const imgResponse = await saveRegistrationImage(formData.image);

      image = imgResponse?.image.uid;
    }

    const payload = {
      participantType: 'MEMBER',
      referenceUid: memberData.memberInfo.uid,
      uniqueIdentifier: formData.email,
      newData: {
        ...formatPayload(memberData.memberInfo, formData),
        imageUid: image ? image : memberData.memberInfo.imageUid,
      },
    };

    const res = await mutateAsync({
      uid: memberData.memberInfo.uid,
      payload,
    });

    if (!res.isError) {
      onOnboardingWizardComplete();
      router.replace(`/members/${memberData.memberInfo.uid}`);
    }
  };

  useEffect(() => {
    onOnboardingWizardOpen();
    // eslint-disable-next-line
  }, []);

  return (
    <div className={s.modal}>
      <div className={s.modalContent}>
        {step !== 'welcome' && <AppLogo className={s.logo} />}
        <button
          type="button"
          className={s.closeButton}
          onClick={() => {
            onOnboardingWizardClose(step);
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
              <AnimatePresence mode="sync">
                {step === 'welcome' && (
                  <WelcomeStep userInfo={userInfo} name={memberData?.memberInfo?.name} key="welcome" />
                )}
                {step === 'profile' && <ProfileStep userInfo={userInfo} key="profile" />}
                {step === 'contacts' && <ContactsStep userInfo={userInfo} />}
                {/*{step === 'expertise' && <ExpertiseStep userInfo={userInfo} />}*/}
              </AnimatePresence>
            </div>
            <OnboardingProgress />
            <OnboardingNavigation userInfo={userInfo} />
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

function formatPayload(memberInfo: any, formData: OnboardingForm) {
  return buildMemberUpdatePayload(memberInfo, {
    name: formData.name,
    email: formData.email,
    city: '',
    region: '',
    country: '',
    telegramHandler: formData.telegram,
    officeHours: formData.officeHours,
  });
}
