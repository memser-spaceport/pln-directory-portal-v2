'use client';

import React from 'react';
import { ProfileSkeleton } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileSkeleton';
import s from './PitchViewSkeleton.module.scss';

export const PitchViewSkeleton = () => (
  <div className={s.root}>
    <div className={s.headerCard}>
      <div className={s.headerTitle} />
      <div className={s.headerDescription} />
      <div className={s.headerDescriptionShort} />
      <div className={s.stepsBlock} />
      <div className={s.alertBlock} />
    </div>

    <ProfileSkeleton />

    <div className={s.supportCard}>
      <div className={s.supportTitle} />
      <div className={s.supportLine} />
    </div>
  </div>
);
