import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';

import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';

import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { useOnSubmit } from '@/components/page/team-details/hooks/useOnSubmit';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import s from './TeamProjectsEdit.module.scss';

type Option = {
  label: string;
  value: string;
};

type TeamProjectsFormData = {
  projects: Option[];
};

interface Props {
  team: ITeam;
  projects: IFormatedTeamProject[];
  toggleIsEditMode: () => void;
}

export function TeamProjectsEdit(props: Props) {
  const { team, projects, toggleIsEditMode } = props;

  const { data: formOptions } = useMemberFormOptions();

  const selectedOptions: Option[] = projects
    .filter((p) => !p.isMaintainingProject)
    .map((p) => ({
      label: p.name,
      value: p.uid,
    }));

  const methods = useForm<TeamProjectsFormData>({
    defaultValues: {
      projects: selectedOptions,
    },
  });

  const { handleSubmit, watch } = methods;

  const { onSubmit: commonOnSubmit, isPending } = useOnSubmit(team, toggleIsEditMode);

  const onSubmit = async (formData: TeamProjectsFormData) => {
    await commonOnSubmit({
      maintainingProjects: formData.projects.map((item) => ({
        uid: item.value,
        name: item.label,
      })),
    });
  };

  const options: Option[] =
    formOptions?.projects?.map((item: { projectUid: string; projectName: string }) => ({
      value: item.projectUid,
      label: item.projectName,
    })) ?? [];

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Add Project" onClose={toggleIsEditMode} isProcessing={isPending} />

        <DetailsSection>
          <FormMultiSelect
            isRequired
            name="projects"
            options={options}
            label="Select or add project"
            placeholder="Search and select projects"
            notFoundContent={
              <div className={s.hint}>
                If you don&apos;t see your project on this list, please{' '}
                <Link href="/projects/add" className={s.link} target="_blank">
                  add your project
                </Link>{' '}
                first.
              </div>
            }
          />
        </DetailsSection>

        <EditFormMobileControls />
      </form>
    </FormProvider>
  );
}
