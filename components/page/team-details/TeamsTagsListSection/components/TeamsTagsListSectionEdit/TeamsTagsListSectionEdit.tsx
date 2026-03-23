import React, { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

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

  const methods = useForm<EditTeamMembershipSource>({
    defaultValues: {
      tags: selectedOptions,
    },
  });

  const { handleSubmit } = methods;

  const commonOnSubmit = useOnSubmit(team, toggleIsEditMode);

  const onSubmit = async (formData: EditTeamMembershipSource) => {
    await commonOnSubmit({
      [dataKey]: formData.tags.map((item) => ({ uid: item.value, title: item.label })),
    });
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title={title} onClose={toggleIsEditMode} />

        <DetailsSection>
          <FormMultiSelect name="tags" label={label} options={options} placeholder={placeholder} />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
