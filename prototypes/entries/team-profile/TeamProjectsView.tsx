'use client';

import isEmpty from 'lodash/isEmpty';

import type { IFormatedTeamProject, ITeam } from '@/types/teams.types';
import { PAGE_ROUTES } from '@/utils/constants';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';

// Import the production leaf project card directly (clean — no store/analytics).
import { TeamProjectCard } from '@/components/page/team-details/TeamProjects/components/TeamProjectsView/components/TeamProjectCard';

import s from '@/components/page/team-details/TeamProjects/components/TeamProjectsView/TeamProjectsView.module.scss';

interface Props {
  team: ITeam;
  projects: IFormatedTeamProject[];
}

/**
 * COPY-SIMPLIFY of production `TeamProjects` + `TeamProjectsView`.
 * Production reads `useCurrentUserStore`, `useRouter`, `useTeamAnalytics` and a
 * "Show All" Modal. Stripped down to the read view fed mock projects, importing
 * the clean `TeamProjectCard` leaf and production scss. Edit access hardcoded false.
 */
export function TeamProjectsView({ team, projects }: Props) {
  const projectsNum = projects?.length ?? 0;
  const noProjects = isEmpty(projects);

  return (
    <DetailsSection>
      <DetailsSectionHeader title={noProjects ? 'Projects' : `Projects (${projectsNum})`} />

      {noProjects ? (
        <DetailsSectionGreyContentContainer className={s.empty}>
          Add projects associated with this team.
        </DetailsSectionGreyContentContainer>
      ) : (
        <div className={s.projects}>
          {projects.map((project, index) => (
            <TeamProjectCard
              key={`${project.uid} + ${index}`}
              onEditClicked={() => {}}
              onCardClicked={() => {}}
              url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`}
              hasProjectsEditAccess={false}
              project={project}
            />
          ))}
        </div>
      )}
    </DetailsSection>
  );
}
