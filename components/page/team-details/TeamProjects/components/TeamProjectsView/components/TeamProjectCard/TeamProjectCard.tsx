'use client';

import { clsx } from 'clsx';
import Image from 'next/image';

import { IFormatedTeamProject } from '@/types/teams.types';

import { RaisingFunds } from '@/components/ui/raising-funds';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import s from './TeamProjectCard.module.scss';

interface Props {
  project: IFormatedTeamProject;
  hasProjectsEditAccess: boolean;
  url: string;
  onCardClicked: (project: IFormatedTeamProject) => void;
  onEditClicked: (project: IFormatedTeamProject) => void;
}

export function TeamProjectCard(props: Props) {
  const { project, url, onCardClicked, onEditClicked } = props;

  const name = project?.name ?? '';
  const tagLine = project?.tagline ?? '';
  const lookingForFunding = project?.lookingForFunding;

  function getLogo() {
    if (project?.isDeleted) {
      return '/icons/deleted-project-logo.svg';
    }
    if (project?.logo) {
      return project?.logo?.url;
    }
    return '/icons/default-project.svg';
  }

  const logo = getLogo();

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
          <Tooltip asChild trigger={<p className={s.tagline}>{tagLine}</p>} content={tagLine} />
        </div>
      </div>
      <div className={s.goto}>
        <div>
          {project?.hasEditAccess && !project?.isDeleted && (
            <div className={s.options}>
              <button
                className={s.editButton}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEditClicked(project);
                }}
              >
                <img loading="lazy" src="/icons/edit-black.svg" />
              </button>
            </div>
          )}
        </div>

        <div className={s.arrowSection}>
          <button className={s.arrowButton}>
            <img loading="lazy" alt="go-to" src="/icons/right-arrow-gray.svg" width={16} height={16} />
          </button>
        </div>
      </div>
    </a>
  );
}
