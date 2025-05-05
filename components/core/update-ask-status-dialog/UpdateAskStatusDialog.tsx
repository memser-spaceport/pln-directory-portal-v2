import React, { FC } from 'react';

import Image from 'next/image';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { StatusForm } from '@/components/core/update-ask-status-dialog/components/StatusForm';

import s from './UpdateAskStatusDialog.module.css';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
  team: ITeam;
  ask: ITeamAsk;
  onClose: () => void;
  isOpen: boolean;
}

export const UpdateAskStatusDialog: FC<Props> = ({ toggleVariant = 'primary', team, ask, onClose, isOpen }) => {
  return (
    <>
      {isOpen && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={onClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Update Status</h2>
            <StatusForm team={team} ask={ask} onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};
