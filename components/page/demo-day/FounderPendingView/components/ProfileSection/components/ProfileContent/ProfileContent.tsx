import React from 'react';
import { ImageIcon, VideoIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import s from './ProfileContent.module.scss';

export const ProfileContent = () => {
  return (
    <div className={s.profileContent}>
      <div className={s.pitchDeck}>
        <ImageIcon />
      </div>
      <div className={s.video}>
        <VideoIcon />
      </div>
    </div>
  );
};
