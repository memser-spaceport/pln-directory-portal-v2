import React from 'react';
import s from './UpdatesPanel.module.scss';

export function EmptyState() {
  return (
    <div className={s.emptyState}>
      <p>No updates yet</p>
    </div>
  );
}

