'use client';

import clsx from 'clsx';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';

import s from './RelatedResults.module.scss';

interface Action {
  name: string;
  type: string;
  directoryLink: string;
}

interface Props {
  actions: Action[];
}

export const RelatedResults = (props: Props) => {
  const { actions } = props;

  const { trackHuskyActionCardClicked } = useHuskyAnalytics();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h3 className={s.title}>
          <img width={16} height={16} src="/icons/husky-brain.svg" />
          <span>Related results</span>
        </h3>
      </div>
      <div className={s.list}>
        {actions.map((action, index) => (
          <a
            target="_blank"
            href={action.directoryLink}
            onClick={() => trackHuskyActionCardClicked(action)}
            className={s.item}
            key={index}
          >
            <div className={s.itemWrapper}>
              <div className={s.iconWrapper}>
                {action.type?.toLowerCase() === 'member' && (
                  <img className={s.icon} src="/icons/husky/husky-member.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'team' && (
                  <img className={s.icon} src="/icons/husky/husky-team.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'project' && (
                  <img className={s.icon} src="/icons/husky/husky-project.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'event' && (
                  <img className={s.icon} src="/icons/husky/husky-event.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'job' && (
                  <img className={s.icon} src="/icons/husky/husky-project.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'news' && (
                  <img className={s.icon} src="/icons/husky/husky-event.svg" alt="icon" />
                )}
                {action.type?.toLowerCase() === 'forum' && (
                  <img className={s.icon} src="/icons/husky/husky-member.svg" alt="icon" />
                )}
              </div>
              <div className={s.itemContent}>
                <p className={clsx(s.name, action.type?.toLowerCase() === 'news' && s.nameFull)}>
                  <span>{action.name}</span>
                </p>
                <p className={s.type}>{action.type || ''}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
