import React, { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { ITeam } from '@/types/teams.types';
import { IFocusArea } from '@/types/shared.types';

import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';

import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import { FormValues } from './types';

import { useGetDefaultValues } from './hooks/useGetDefaultValues';
import { useGetOptionsPerGroup } from './hooks/useGetOptionsPerGroup';

import s from './TeamFocusAreasEdit.module.scss';

interface Props {
  team: ITeam;
  focusAreas: IFocusArea[];
  toggleIsEditMode: () => void;
}

export function TeamFocusAreasEdit(props: Props) {
  const { team, focusAreas, toggleIsEditMode } = props;

  const defaultValues = useGetDefaultValues({
    team,
    focusAreas,
  });
  const optionsPerGroup = useGetOptionsPerGroup(focusAreas);

  const methods = useForm<FormValues>({
    defaultValues,
  });

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, toggleIsEditMode);

  const onSubmit = async (formData: FormValues) => {
    const flatFocusAreas = Object.values(formData)
      .flat()
      .map((item) => ({
        uid: item.value,
        title: item.label,
      }));

    await commonOnSubmit({
      focusAreas: flatFocusAreas,
    });
  };

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Edit Focus Areas" onClose={toggleIsEditMode} isProcessing={isPending} />

        <DetailsSection
          classes={{
            root: s.areas,
          }}
        >
          {focusAreas.map((parent) => (
            <FormMultiSelect
              key={parent.uid}
              name={parent.uid}
              label={parent.title}
              options={optionsPerGroup[parent.uid]}
              placeholder={`Select and add topics within ${parent.title}`}
            />
          ))}
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
