import React from 'react';
import s from './UpdatesPanel.module.scss';

export function EmptyState() {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyContent}>
        <img src="/images/empty-nature.svg" alt="" className={s.emptyIllustration} />
        <h3 className={s.emptyTitle}>No new updates</h3>
        <p className={s.emptyDescription}>Relevant updates from forum, demo day and events will appear here</p>
      </div>
    </div>
  );
}
