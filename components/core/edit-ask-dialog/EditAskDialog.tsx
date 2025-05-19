import React, { FC } from 'react';

import Image from 'next/image';
import { ITeam, ITeamAsk } from '@/types/teams.types';

import s from './EditAskDialog.module.scss';
import { UpdateForm } from '@/components/core/edit-ask-dialog/components/UpdateForm';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
  onClose: () => void;
  isOpen: boolean;
}

export const EditAskDialog: FC<Props> = ({ team, ask, onClose, isOpen }) => {
  return (
    <>
      {isOpen && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={onClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Edit your Asks</h2>
            <p className={s.description}>Share short updates or requests for help, such as hiring needs, fundraising, or partnership opportunities.</p>
            <UpdateForm team={team} ask={ask} onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
};
