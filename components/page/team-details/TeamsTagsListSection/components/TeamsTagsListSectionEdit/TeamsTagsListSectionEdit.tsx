import React, { ReactNode, useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { ITeam } from '@/types/teams.types';

import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

type Option = {
  label: string;
  value: string;
};

type EditTeamMembershipSource = {
  tags: Option[];
};

export interface TeamsTagsListSectionEditProps {
  title: ReactNode;
  team: ITeam;
  options: Option[];
  selectedOptions: Option[];
  label: ReactNode;
  placeholder: string;
  toggleIsEditMode: () => void;
  dataKey: string;
}

export function TeamsTagsListSectionEdit(props: TeamsTagsListSectionEditProps) {
  const { title, dataKey, team, label, placeholder, options, selectedOptions, toggleIsEditMode } = props;

  const analytics = useTeamAnalytics();

  const methods = useForm<EditTeamMembershipSource>({
    defaultValues: {
      tags: selectedOptions,
    },
  });

  const { handleSubmit, watch } = methods;
  const formValues = watch();
  const prevValuesRef = useRef<EditTeamMembershipSource | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      prevValuesRef.current = JSON.parse(JSON.stringify(formValues));
      isFirstRenderRef.current = false;
      return;
    }
    const prev = prevValuesRef.current;
    const curr = formValues;
    if (JSON.stringify(prev?.tags) !== JSON.stringify(curr.tags)) {
      const value = curr.tags.map((o) => o.value);
      analytics.onTeamDetailEditInputChanged({ field: dataKey, value });
    }
    prevValuesRef.current = JSON.parse(JSON.stringify(formValues));
  }, [formValues, analytics, dataKey]);

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, toggleIsEditMode);

  const onSubmit = async (formData: EditTeamMembershipSource) => {
    await commonOnSubmit({
      [dataKey]: formData.tags.map((item) => ({ uid: item.value, title: item.label })),
    });

    analytics.onTeamDetailEditFormSaved({
      from: dataKey,
      values: {
        [dataKey]: formData.tags.map((item) => item.value),
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title={title} onClose={toggleIsEditMode} isProcessing={isPending} />

        <DetailsSection>
          <FormMultiSelect name="tags" label={label} options={options} placeholder={placeholder} />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
