import { IFocusArea } from '@/types/shared.types';

import s from './MobileFocusAreaCard.module.scss';

interface Props {
  focusArea: IFocusArea;
  projectAncestorFocusAreas: any[];
  onTeamClick: (focusArea: IFocusArea) => void;
  onProjectClick: (focusArea: IFocusArea) => void;
  onSeeMoreClick: (focusArea: IFocusArea & { projectAncestorFocusAreas: any[] }) => void;
}

export function MobileFocusAreaCard(props: Props) {
  const { focusArea, projectAncestorFocusAreas, onTeamClick, onProjectClick, onSeeMoreClick } = props;

  const image = `/icons/mb ${focusArea?.title?.toLowerCase()}.svg`;
  const teamAncestorFocusAreas = focusArea?.teamAncestorFocusAreas;
  const isLongName = focusArea?.title?.length > 16;
  const descriptionTruncateLength = isLongName ? 50 : 70;

  return (
    <div className={s.card}>
      <div className={s.headerSection}>
        <h2 className={s.title}>{focusArea?.title}</h2>
        <div>
          <div className={s.description}>
            {focusArea?.description?.length < descriptionTruncateLength ? (
              focusArea?.description
            ) : (
              <div>
                {focusArea?.description?.slice(0, descriptionTruncateLength) + '...'}
                <span
                  className={s.seeMore}
                  onClick={() => onSeeMoreClick({ ...focusArea, projectAncestorFocusAreas })}
                >
                  see more
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={s.footer}>
        {teamAncestorFocusAreas?.length > 0 && (
          <div className={s.teamsSection} onClick={() => onTeamClick(focusArea)}>
            <div className={s.count}>{teamAncestorFocusAreas?.length}</div>
            <div className={s.countText}>
              Teams
              <img width={14} height={14} src="/icons/rounded-right-arrow.svg" alt="team" />
            </div>
          </div>
        )}
        {projectAncestorFocusAreas?.length > 0 && (
          <div className={s.projectsSection} onClick={() => onProjectClick(focusArea)}>
            <div className={s.count}>{projectAncestorFocusAreas?.length}</div>
            <div className={s.countText}>
              Projects
              <img width={14} height={14} src="/icons/rounded-right-arrow.svg" alt="project" />
            </div>
          </div>
        )}
      </div>
      <img className={s.icon} alt={focusArea?.title} src={image} />
    </div>
  );
}
