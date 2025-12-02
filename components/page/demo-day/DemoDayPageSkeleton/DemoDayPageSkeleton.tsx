import React from 'react';
import s from './DemoDayPageSkeleton.module.scss';

export const DemoDayPageSkeleton = () => (
  <div className={s.skeletonContainer}>
    <div className={s.skeletonContent}>
      <div className={s.skeletonTitle} />
      <div className={s.skeletonSubtitle} />
      <div className={s.skeletonInfo}>
        <div className={s.skeletonInfoItem} />
        <div className={s.skeletonInfoItem} />
        <div className={s.skeletonInfoItem} />
      </div>
      <div className={s.skeletonButtons}>
        <div className={s.skeletonButton} />
        <div className={s.skeletonButton} />
      </div>
    </div>
  </div>
);

