import React, { FC, useMemo, useState } from 'react';

import Image from 'next/image';

import { clsx } from 'clsx';
import { ITeam, ITeamAsk } from '@/types/teams.types';
import { Tabs } from '@/components/ui/tabs/Tabs';
import DeleteAskDialog from '@/components/core/delete-ask-dialog/DeleteAskDialog';

import s from './EditAskDialog.module.css';
import { UpdateForm } from '@/components/core/edit-ask-dialog/components/UpdateForm';
import { StatusForm } from '@/components/core/edit-ask-dialog/components/StatusForm';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
  team: ITeam;
  ask: ITeamAsk;
}

type View = 'Update' | 'Status';

export const EditAskDialog: FC<Props> = ({ toggleVariant = 'primary', team, ask }) => {
  const [open, toggleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<View>('Update');
  const tabs = useMemo(() => {
    return [
      {
        name: 'Update',
      },
      {
        name: 'Status',
        endAdornment: (
          <div
            className={clsx(s.statusBadge, {
              [s.closed]: !!ask.closedReason,
            })}
          >
            {ask.status === 'OPEN' ? 'Active' : ask.closedReason}
          </div>
        ),
      },
    ];
  }, [ask.closedReason, ask.status]);

  return (
    <>
      <button
        className={clsx(s.toggleButton, {
          [s.secondary]: toggleVariant === 'secondary',
        })}
        onClick={() => toggleOpen(true)}
      >
        <Image height={20} width={20} alt="edit" loading="lazy" src="/icons/edit.svg" />
        Edit
      </button>

      {open && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={() => toggleOpen(false)}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>Edit your Asks</h2>
            <p className={s.description}>Share short updates or requests for help, such as hiring needs, fundraising, or partnership opportunities.</p>
            <Tabs variant="secondary" tabs={tabs} activeTab={activeTab} onTabClick={(item) => setActiveTab(item as View)}>
              <DeleteAskDialog ask={ask} team={team} />
            </Tabs>
            {activeTab === 'Update' && <UpdateForm team={team} ask={ask} onClose={() => toggleOpen(false)} />}
            {activeTab === 'Status' && <StatusForm team={team} ask={ask} onClose={() => toggleOpen(false)} />}
          </div>
        </div>
      )}
    </>
  );
};
