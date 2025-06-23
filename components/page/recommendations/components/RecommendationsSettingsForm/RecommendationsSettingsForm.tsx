'use client';

import React, { useEffect } from 'react';

import s from './RecommendationsSettingsForm.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { GeneralSettings } from '@/components/page/recommendations/components/GeneralSettings';
import { FineTuneMatches } from '@/components/page/recommendations/components/FineTuneMatches';
import { IUserInfo } from '@/types/shared.types';
import { RecommendationSettingsFormControls } from '@/components/page/recommendations/components/RecommendationSettingsFormControls';
import { MemberNotificationSettings } from '@/services/members/types';
import { getInitialValues } from '@/components/page/recommendations/components/RecommendationsSettingsForm/helpers';
import { useUpdateMemberNotificationsSettings } from '@/services/members/hooks/useUpdateMemberNotificationsSettings';
import { useRouter } from 'next/navigation';

interface Props {
  uid: string;
  userInfo: IUserInfo;
  initialData: MemberNotificationSettings | null;
}

export const RecommendationsSettingsForm = ({ uid, userInfo, initialData }: Props) => {
  const router = useRouter();
  const methods = useForm<TRecommendationsSettingsForm>({
    defaultValues: getInitialValues(initialData),
  });

  const { handleSubmit, reset } = methods;

  const { mutateAsync } = useUpdateMemberNotificationsSettings();

  useEffect(() => {
    if (initialData) {
      reset(getInitialValues(initialData));
    }
  }, [initialData, reset]);

  const onSubmit = async (formData: TRecommendationsSettingsForm) => {
    const res = await mutateAsync({
      memberUid: userInfo.uid,
      recommendationsEnabled: formData.enabled,
      emailFrequency: formData.frequency.value,
      industryTagList: formData.industryTags.map((tag) => tag.value),
      roleList: formData.roles.map((role) => role.value),
      fundingStageList: formData.fundingStage.map((stage) => stage.value),
    });

    if (res) {
      router.refresh();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        className={s.root}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <h5 className={s.title}>Recommendation Email Frequency</h5>
        <GeneralSettings />
        <FineTuneMatches />
        <RecommendationSettingsFormControls />
      </form>
    </FormProvider>
  );
};
