import React from 'react';
import { EditIcon } from '@/components/page/demo-day/icons/DemoDayIcons';
import s from './ProfileActions.module.scss';

interface ProfileActionsProps {
  onEditProfile: () => void;
}

export const ProfileActions = ({ onEditProfile }: ProfileActionsProps) => {
  return (
    <div className={s.actionArea}>
      <button className={s.editButton} onClick={onEditProfile}>
        <EditIcon />
        <span>Edit Team Fundraising Profile</span>
      </button>
    </div>
  );
};
