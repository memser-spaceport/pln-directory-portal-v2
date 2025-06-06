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
import { useUpdateMember } from '@/services/members/hooks/useUpdateMember';
import { saveRegistrationImage } from '@/services/registration.service';

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

  const methods = useForm<OnboardingForm>({
    defaultValues: {
      name: memberData?.memberInfo?.name,
      email: memberData?.memberInfo?.email,
      officeHours: '',
      image: null,
      telegram: '',
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
      router.replace(`/members/${memberData.memberInfo.uid}`);
    }
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
              {step === 'welcome' && <WelcomeStep userInfo={userInfo} name={memberData?.memberInfo?.name} />}
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

function formatPayload(memberInfo: any, formData: OnboardingForm) {
  return {
    name: formData.name,
    email: formData.email,
    plnStartDate: memberInfo.plnStartDate,
    city: '',
    region: '',
    country: '',
    teamOrProjectURL: memberInfo.teamOrProjectURL,
    linkedinHandler: memberInfo.linkedinHandler,
    discordHandler: memberInfo.discordHandler,
    twitterHandler: memberInfo.twitterHandler,
    githubHandler: memberInfo.githubHandler,
    telegramHandler: formData.telegram,
    officeHours: formData.officeHours,
    moreDetails: memberInfo.moreDetails,
    openToWork: memberInfo.openToWork,
    plnFriend: memberInfo.plnFriend,
    teamAndRoles: memberInfo.teamMemberRoles,
    projectContributions: memberInfo.projectContributions,
    skills: memberInfo.skills,
    bio: memberInfo.bio,
  };
}
