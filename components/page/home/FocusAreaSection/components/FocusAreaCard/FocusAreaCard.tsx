import { IFocusArea } from '@/types/shared.types';

import s from './FocusAreaCard.module.scss';

interface Props {
  focusArea: IFocusArea;
  projectAncestorFocusAreas: any[];
  onTeamClick: (focusArea: IFocusArea) => void;
  onProjectClick: (focusArea: IFocusArea) => void;
  onSeeMoreClick: (focusArea: IFocusArea & { projectAncestorFocusAreas: any[] }) => void;
}

export function FocusAreaCard(props: Props) {
  const { focusArea, projectAncestorFocusAreas, onTeamClick, onProjectClick, onSeeMoreClick } = props;

  const image = `/icons/${focusArea?.title?.toLowerCase()}.svg`;
  const teamAncestorFocusAreas = focusArea?.teamAncestorFocusAreas;
  const descriptionTruncateLength = 140;

  return (
    <div className={s.card}>
      <div className={s.headerSection}>
        <h2 className={s.title}>{focusArea?.title}</h2>
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
      <div className={s.footer}>
        {teamAncestorFocusAreas?.length > 0 && (
          <div className={s.footerRow} onClick={() => onTeamClick(focusArea)}>
            <div className={s.footerInfo}>
              <span className={s.footerCount}>{teamAncestorFocusAreas?.length || 0}</span>
              <span className={s.footerText}>Teams</span>
            </div>
            <div className={s.avatarsContainer}>
              <div className={s.avatars}>
                {teamAncestorFocusAreas?.slice(0, 3).map((item: any) => (
                  <img
                    title="Team"
                    key={item?.team?.uid}
                    width={24}
                    height={24}
                    src={item?.team?.logo?.url || '/icons/team-default-profile.svg'}
                    alt="team"
                    className={s.avatar}
                  />
                ))}
              </div>
              <img src="/icons/arrow-blue-right.svg" alt="project" />
            </div>
          </div>
        )}
        {projectAncestorFocusAreas?.length > 0 && (
          <div className={s.footerRow} onClick={() => onProjectClick(focusArea)}>
            <div className={s.footerInfo}>
              <span className={s.footerCount}>{projectAncestorFocusAreas?.length}</span>
              <span className={s.footerText}>Projects</span>
            </div>
            <div className={s.avatarsContainer}>
              <div className={s.avatars}>
                {projectAncestorFocusAreas?.slice(0, 3).map((item: any) => (
                  <img
                    title="Project"
                    key={item?.project?.uid}
                    width={24}
                    height={24}
                    src={item?.project?.logo?.url || '/icons/project-default.svg'}
                    alt="project"
                    className={s.avatar}
                  />
                ))}
              </div>
              <img src="/icons/arrow-blue-right.svg" alt="project" />
            </div>
          </div>
        )}
      </div>
      <img className={s.icon} alt={focusArea?.title} src={image} />
    </div>
  );
}
