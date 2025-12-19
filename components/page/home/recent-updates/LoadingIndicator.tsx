import React from 'react';
import s from './RecentUpdatesSection.module.scss';

export function LoadingIndicator() {
  return (
    <div className={s.loadingIndicator}>
      <div className={s.spinner} />
      <span className={s.loadingText}>Loading...</span>
    </div>
  );
}

