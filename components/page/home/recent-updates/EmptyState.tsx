import React from 'react';
import s from './RecentUpdatesSection.module.scss';

export function EmptyState() {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyContent}>
        <img src="/images/empty-nature.svg" alt="" className={s.emptyIllustration} />
        <h3 className={s.emptyTitle}>You are all caught up!</h3>
        <p className={s.emptyDescription}>
          Relevant updates from forum posts, demo day and your connections will appear here.
        </p>
      </div>
    </div>
  );
}

