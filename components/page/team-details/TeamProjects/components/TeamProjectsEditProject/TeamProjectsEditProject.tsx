import React, { useState } from 'react';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { getParsedValue } from '@/utils/common.utils';
import { toast } from '@/components/core/ToastContainer';
import { removeContributingTeamFromProject } from '@/app/actions/projects.actions';
import { getProjectLogo } from '@/components/page/team-details/TeamProjects/utils/getProjectLogo';

import { EditFormControls } from '@/components/common/profile/EditFormControls';
import { DetailsSection, DetailsSectionGreyContentContainer } from '@/components/common/profile/DetailsSection';
import ConfirmDialog from '@/components/core/ConfirmDialog/ConfirmDialog';

import { TrashIcon, InfoIcon, ArrowUpRightIcon } from './icons';

import s from './TeamProjectsEditProject.module.scss';

interface Props {
  project: IFormatedTeamProject;
  team: ITeam;
  returnToViewMode: () => void;
}

export function TeamProjectsEditProject(props: Props) {
  const { project, team, returnToViewMode } = props;

  const router = useRouter();
  const methods = useForm();
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const logo = getProjectLogo(project);

  const handleRemove = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    if (!authToken) {
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeContributingTeamFromProject(project.uid, team.id, authToken);

      if (result.isError) {
        toast.error('Failed to remove project. Please try again.');
        return;
      }

      toast.success('Project removed from team successfully.');
      returnToViewMode();
      router.refresh();
    } catch {
      toast.error('Failed to remove project. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <EditFormControls title="Edit Project" onClose={returnToViewMode} />

      <DetailsSection>
        <div className={s.body}>
          <div className={s.fieldGroup}>
            <label className={s.label}>
              Project Name <span className={s.required}>*</span>
            </label>
            <div className={s.readOnlyInput}>
              <img src={logo} alt="" className={s.projectLogo} />
              <span className={s.projectName}>{project.name}</span>
            </div>
          </div>

          <DetailsSectionGreyContentContainer className={s.info}>
            <InfoIcon />
            <span className={s.infoText}>Edit project details on</span>
            <Link href={`/projects/update/${project.uid}`} target="_blank" className={s.infoLink}>
              [Project&apos;s Page] <ArrowUpRightIcon />
            </Link>
          </DetailsSectionGreyContentContainer>

          {!project.isMaintainingProject && (
            <>
              <div className={s.divider} />

              <button className={s.removeBtn} type="button" onClick={() => setIsOpenDelete(true)}>
                <TrashIcon /> Remove Project
              </button>

              <ConfirmDialog
                title="Remove Project"
                desc="Are you sure you want to remove this project from the team?"
                isOpen={isOpenDelete}
                onClose={() => setIsOpenDelete(false)}
                onConfirm={handleRemove}
                disabled={isRemoving}
                confirmTitle={isRemoving ? 'Processing...' : 'Remove'}
              />
            </>
          )}
        </div>
      </DetailsSection>
    </FormProvider>
  );
}
