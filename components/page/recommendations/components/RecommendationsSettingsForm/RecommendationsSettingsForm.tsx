'use client';

import React from 'react';

import s from './RecommendationsSettingsForm.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { GeneralSettings } from '@/components/page/recommendations/components/GeneralSettings';
import { FineTuneMatches } from '@/components/page/recommendations/components/FineTuneMatches';
import { IUserInfo } from '@/types/shared.types';
import { RecommendationSettingsFormControls } from '@/components/page/recommendations/components/RecommendationSettingsFormControls';

interface Props {
  uid: string;
  userInfo: IUserInfo;
}

export const RecommendationsSettingsForm = ({ uid, userInfo }: Props) => {
  const methods = useForm<TRecommendationsSettingsForm>({
    defaultValues: {
      enabled: false,
      frequency: { value: 'weekly', label: 'Weekly' },
      industryTags: [],
      roles: [],
      fundingStage: [],
    },
    mode: 'all',
  });
  const { handleSubmit, setValue, watch, register } = methods;

  const onSubmit = (formData: TRecommendationsSettingsForm) => {
    console.log(formData);
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
