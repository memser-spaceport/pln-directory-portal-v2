import React from 'react';
import s from './DemoDayCardSkeleton.module.scss';

export const DemoDayCardSkeleton = () => {
  return (
    <div className={s.card}>
      <div className={s.avatarSkeleton} />
      <div className={s.cardContent}>
        <div className={s.overline}>
          <div className={s.badgeSkeleton} />
          <div className={s.dateSkeleton} />
        </div>
        <div className={s.titleSkeleton} />
        <div className={s.descriptionSkeleton}>
          <div className={s.line} />
          <div className={s.lineShort} />
        </div>
      </div>
      <div className={s.buttonSkeleton} />
    </div>
  );
};
