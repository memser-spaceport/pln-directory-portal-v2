'use client';

import { clsx } from 'clsx';
import Image from 'next/image';
import { MouseEvent } from 'react';

import { IFormatedTeamProject } from '@/types/teams.types';

import { RaisingFunds } from '@/components/ui/raising-funds';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import s from './TeamProjectCard.module.scss';
import { getProjectLogo } from '@/components/page/team-details/TeamProjects/utils/getProjectLogo';

interface Props {
  url: string;
  project: IFormatedTeamProject;
  hasProjectsEditAccess: boolean;
  onEditClicked: (project: IFormatedTeamProject) => void;
  onCardClicked: (project: IFormatedTeamProject) => void;
}

export function TeamProjectCard(props: Props) {
  const { project, url, onCardClicked, onEditClicked, hasProjectsEditAccess } = props;
  const { name, tagline, lookingForFunding } = project;

  const logo = getProjectLogo(project);

  function onEdit(e: MouseEvent) {
    e.preventDefault();

    onEditClicked(project);
  }

  return (
    <a
      target="_blank"
      onClick={() => onCardClicked(project)}
      href={url}
      className={clsx(s.root, { [s.deleted]: project?.isDeleted })}
      title={project?.isDeleted ? 'Project does not exist' : undefined}
    >
      <div className={s.profile}>
        <img loading="lazy" alt="team-logo" className={s.profileLogo} src={logo} height={40} width={40} />
        <div className={s.nameAndTagline}>
          <div className={s.nameAndFunds}>
            <Tooltip asChild trigger={<h2 className={s.name}>{name}</h2>} content={name} />
            {project?.isMaintainingProject && (
              <Tooltip
                side="top"
                asChild
                trigger={
                  <div className={s.maintainerBadge}>
                    <Image
                      src="/icons/badge/maintainer.svg"
                      alt="maintainer image"
                      width={20}
                      height={20}
                      className="rounded"
                    />{' '}
                  </div>
                }
                content={'Maintainer'}
              />
            )}
            {lookingForFunding && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className={s.raisingFundsWeb}
              >
                <Tooltip
                  asChild
                  side="top"
                  trigger={
                    <div>
                      <RaisingFunds />{' '}
                    </div>
                  }
                  content={'Raising Funds'}
                />
              </div>
            )}
          </div>
          <Tooltip asChild trigger={<p className={s.tagline}>{tagline}</p>} content={tagline} />
        </div>
      </div>

      {hasProjectsEditAccess && (
        <div onClick={onEdit}>
          <img className={s.edit} loading="lazy" src="/icons/edit-chat.svg" />
        </div>
      )}
    </a>
  );
}
