import React, { useState } from 'react';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { IFormatedTeamProject, ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { getParsedValue } from '@/utils/common.utils';
import { toast } from '@/components/core/ToastContainer';
import { addContributingTeamToProject } from '@/app/actions/projects.actions';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { FormMultiSelect, MultiSelectOption } from '@/components/form/FormMultiSelect';
import { EditFormMobileControls } from '@/components/page/member-details/components/EditFormMobileControls';

import { useGetProjectOptions } from './hooks/useGetProjectOptions';

import s from './TeamProjectsAddProject.module.scss';

type TeamProjectsFormData = {
  projects: MultiSelectOption[];
};

interface Props {
  team: ITeam;
  projects: IFormatedTeamProject[];
  userInfo: IUserInfo | undefined;
  toggleIsEditMode: () => void;
}

export function TeamProjectsAddProject(props: Props) {
  const { team, projects, userInfo, toggleIsEditMode } = props;

  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);

  const methods = useForm<TeamProjectsFormData>({
    defaultValues: {
      projects: [],
    },
  });

  const { handleSubmit } = methods;

  const options = useGetProjectOptions({
    userInfo,
    projects,
  });

  const onSubmit = async (formData: TeamProjectsFormData) => {
    const authToken = getParsedValue(Cookies.get('authToken'));

    if (!authToken) {
      return;
    }

    setIsProcessing(true);
    try {
      const teamPayload = { uid: team.id, name: team.name! };

      const results = await Promise.all(
        formData.projects.map((p) => addContributingTeamToProject(p.value, teamPayload, authToken)),
      );

      const hasError = results.some((r) => r.isError);
      if (hasError) {
        toast.error('Some projects failed to update. Please try again.');
      } else {
        toast.success('Projects updated successfully.');
      }

      toggleIsEditMode();
      router.refresh();
    } catch {
      toast.error('Failed to update projects. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <EditFormControls title="Add Project" onClose={toggleIsEditMode} isProcessing={isProcessing} />

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
