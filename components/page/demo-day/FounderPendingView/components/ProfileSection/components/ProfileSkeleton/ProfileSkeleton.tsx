import React from 'react';
import s from './ProfileSkeleton.module.scss';

export const ProfileSkeleton = () => (
  <div className={s.profileCard}>
    {/* Header Skeleton */}
    <div className={s.profileHeader}>
      <div className={`${s.profileImage} ${s.skeleton}`} />
      <div className={s.memberDetails}>
        <div className={s.memberInfo}>
          <div className={s.memberNameContainer}>
            <div className={`${s.skeletonText} ${s.skeletonTitle}`} />
          </div>
          <div className={`${s.skeletonText} ${s.skeletonDescription}`} />
        </div>
        <div className={s.tagList}>
          <div className={`${s.skeletonText} ${s.skeletonTag}`} />
          <div className={s.tagDivider} />
          <div className={`${s.skeletonText} ${s.skeletonTag}`} />
          <div className={`${s.skeletonText} ${s.skeletonTag}`} />
          <div className={`${s.skeletonText} ${s.skeletonTag}`} />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className={s.profileContent}>
      <div className={`${s.pitchDeck} ${s.skeleton}`} />
      <div className={`${s.video} ${s.skeleton}`} />
    </div>

    {/* Divider */}
    <div className={s.profileDivider} />

    {/* Action Area Skeleton */}
    <div className={s.actionArea}>
      <div className={`${s.skeletonText} ${s.skeletonButton}`} />
    </div>
  </div>
);
