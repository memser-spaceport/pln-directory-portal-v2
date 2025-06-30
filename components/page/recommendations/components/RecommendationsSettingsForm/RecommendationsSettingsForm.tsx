'use client';

import React, { useEffect } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { GeneralSettings } from '@/components/page/recommendations/components/GeneralSettings';
import { FineTuneMatches } from '@/components/page/recommendations/components/FineTuneMatches';
import { IUserInfo } from '@/types/shared.types';
import { RecommendationSettingsFormControls } from '@/components/page/recommendations/components/RecommendationSettingsFormControls';
import { getInitialValues, recommendationsSettingsSchema } from '@/components/page/recommendations/components/RecommendationsSettingsForm/helpers';
import { useUpdateMemberNotificationsSettings } from '@/services/members/hooks/useUpdateMemberNotificationsSettings';
import { useRouter } from 'next/navigation';

import s from './RecommendationsSettingsForm.module.scss';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRecommendationsSettingsEvents } from '@/components/page/recommendations/components/RecommendationsSettingsForm/hooks';
import { useSettingsAnalytics } from '@/analytics/settings.analytics';
import { triggerLoader } from '@/utils/common.utils';

interface Props {
  uid: string;
  userInfo: IUserInfo;
  initialData: TRecommendationsSettingsForm | null;
}

export const RecommendationsSettingsForm = ({ uid, userInfo, initialData }: Props) => {
  const router = useRouter();
  const methods = useForm<TRecommendationsSettingsForm>({
    defaultValues: initialData ?? getInitialValues(),
    resolver: yupResolver(recommendationsSettingsSchema),
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  const { mutateAsync } = useUpdateMemberNotificationsSettings();

  useRecommendationsSettingsEvents();
  const { onRecommendationsSettingsSaveClicked } = useSettingsAnalytics();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    triggerLoader(false);
    function handleNavigate(e: any) {
      const url = e.detail.url;

      let proceed = true;

      const isSame = !isDirty;

      if (!isSame) {
        proceed = confirm('There are some unsaved changed. Do you want to proceed?');
      }

      if (!proceed) {
        return;
      }

      triggerLoader(true);

      router.push(url);
      router.refresh();
    }

    document.addEventListener('settings-navigate', handleNavigate);

    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [isDirty, router]);

  const onSubmit = async (formData: TRecommendationsSettingsForm) => {
    const payload = {
      memberUid: userInfo.uid,
      subscribed: formData.enabled,
      emailFrequency: formData.frequency.value,
      // industryTagList: formData.industryTags.map((tag) => tag.label),
      roleList: formData.roles.map((role) => role.label),
      fundingStageList: formData.fundingStage.map((stage) => stage.label),
      technologyList: formData.teamTechnology.map((stage) => stage.label),
      keywordList: formData.keywords,
    };

    onRecommendationsSettingsSaveClicked(payload);

    const res = await mutateAsync(payload);

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
        <h5 className={s.title}>Recommendations</h5>
        <GeneralSettings uid={uid} />
        <FineTuneMatches />
        <RecommendationSettingsFormControls />
      </form>
    </FormProvider>
  );
};
