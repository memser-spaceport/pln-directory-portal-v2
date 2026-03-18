import React from 'react';
import s from './loading.module.scss';

export default function Loading() {
  return (
    <div className={s.root}>
      <div className={s.header}>
        <div className={s.skeletonTitle} />
        <div className={s.skeletonSubtitle} />
      </div>
      <div className={s.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.skeletonCard} />
        ))}
      </div>
    </div>
  );
}
