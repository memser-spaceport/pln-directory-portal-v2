import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import type { IDirectoryAction } from '../../types/directoryAction';

import s from './ActionCard.module.scss';

interface Props {
  action: IDirectoryAction;
}

export const ActionCard = (props: Props) => {
  const { action } = props;

  const { trackDirectoryResultsCardClicked } = useHuskyAnalytics();

  return (
    <a
      target="_blank"
      href={action.source}
      onClick={() => trackDirectoryResultsCardClicked(action)}
      className={s.root}
      tabIndex={0}
      aria-label={`${action.name} - ${action.type}`}
    >
      <div className={s.wrapper}>
        <div className={s.iconWrapper}>
          {(action.type?.toLowerCase() === 'member' || action.type?.toLowerCase() === 'member-event-participation') && (
            <img className={s.icon} src="/icons/husky/husky-member.svg" alt="Member icon" />
          )}
          {action.type?.toLowerCase() === 'team' && (
            <img className={s.icon} src="/icons/husky/husky-team.svg" alt="Team icon" />
          )}
          {action.type?.toLowerCase() === 'project' && (
            <img className={s.icon} src="/icons/husky/husky-project.svg" alt="Project icon" />
          )}
          {(action.type?.toLowerCase() === 'event' || action.type?.toLowerCase() === 'irl-event') && (
            <img className={s.icon} src="/icons/husky/husky-event.svg" alt="Event icon" />
          )}
        </div>
        <div className={s.content}>
          <p title={action.name} className={s.name}>
            <span title={action.name}>{action.name}</span>
          </p>
          <p className={s.type}>
            {action.type
              ? action.type === 'irl-event'
                ? 'Event'
                : action.type === 'member-event-participation'
                  ? 'Member'
                  : action.type
              : ''}
          </p>
        </div>
      </div>
    </a>
  );
};
