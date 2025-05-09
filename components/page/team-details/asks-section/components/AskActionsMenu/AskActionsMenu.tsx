import React, { FC, useCallback, useRef, useState } from 'react';

import s from './AskActionsMenu.module.css';
import Image from 'next/image';
import { EditAskDialog } from '@/components/core/edit-ask-dialog';
import { DeleteAskDialog } from '@/components/core/delete-ask-dialog';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { clsx } from 'clsx';
import useClickedOutside from '@/hooks/useClickedOutside';
import { UpdateAskStatusDialog } from '@/components/core/update-ask-status-dialog';

interface Props {
  team: ITeam;
  ask: ITeamAsk;
}

export const AskActionsMenu: FC<Props> = ({ team, ask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogsState, setDialogsState] = useState<{
    status: boolean;
    edit: boolean;
    delete: boolean;
  }>({
    status: false,
    edit: false,
    delete: false,
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useClickedOutside({
    ref: menuRef,
    callback: () => setIsOpen(false),
  });

  return (
    <>
      <div className={s.root} ref={menuRef}>
        <button className={s.controlButton} onClick={toggleOpen} aria-label="asks menu button" aria-haspopup="true" aria-expanded={isOpen} type="button">
          <Image loading="lazy" className={s.menuIcon} alt="asks menu icon" src={'/icons/menu-dots-vertical.svg'} height={20} width={20} />
        </button>
        <div
          className={clsx(s.dropdown, {
            [s.open]: isOpen,
          })}
        >
          <button
            className={clsx(s.menuButton)}
            onClick={() => {
              setDialogsState((prevState) => ({
                ...prevState,
                status: true,
              }));
              toggleOpen();
            }}
          >
            <Image height={20} width={20} alt="edit" loading="lazy" src="/icons/archive.svg" />
            Update Status
          </button>
          <button
            className={clsx(s.menuButton)}
            onClick={() => {
              setDialogsState((prevState) => ({
                ...prevState,
                edit: true,
              }));
              toggleOpen();
            }}
          >
            <Image height={20} width={20} alt="edit" loading="lazy" src="/icons/edit-outlined.svg" />
            Edit
          </button>
          <button
            className={clsx(s.menuButton)}
            onClick={() => {
              setDialogsState((prevState) => ({
                ...prevState,
                delete: true,
              }));
              toggleOpen();
            }}
          >
            <Image height={20} width={20} alt="edit" loading="lazy" src="/icons/delete.svg" />
            Delete
          </button>
        </div>
      </div>
      <UpdateAskStatusDialog team={team} ask={ask} isOpen={dialogsState.status} onClose={() => setDialogsState((prevState) => ({ ...prevState, status: false }))} />
      <EditAskDialog team={team} ask={ask} isOpen={dialogsState.edit} onClose={() => setDialogsState((prevState) => ({ ...prevState, edit: false }))} />
      <DeleteAskDialog team={team} ask={ask} isOpen={dialogsState.delete} onClose={() => setDialogsState((prevState) => ({ ...prevState, delete: false }))} />
    </>
  );
};
