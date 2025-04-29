import React, { FC, useState } from 'react';
import Image from 'next/image';
import { useDeleteAskMutation } from '@/services/teams/hooks/useDeleteAskMutation';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { triggerLoader } from '@/utils/common.utils';
import { clsx } from 'clsx';

import s from './DeleteAskDialog.module.css';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
}

export const DeleteAskDialog: FC<Props> = ({ team, ask }) => {
  const [open, toggleOpen] = useState(false);

  const { mutateAsync, isPending } = useDeleteAskMutation(team);

  return (
    <>
      <button className={clsx(s.toggleButton)} onClick={() => toggleOpen(true)}>
        Delete
      </button>
      {open && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={() => toggleOpen(false)}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Are you sure you want to delete your asks?</h2>
            <p className={s.confirmationMessage}>Clicking &apos;Delete&apos; will remove your asks</p>
            <div className={s.dialogControls}>
              <button type="button" className={s.secondaryButton} onClick={() => toggleOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={s.errorButton}
                onClick={async () => {
                  triggerLoader(true);
                  await mutateAsync({ teamId: team.id, ask, teamName: team.name! });
                  triggerLoader(false);
                }}
                disabled={isPending}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAskDialog;
