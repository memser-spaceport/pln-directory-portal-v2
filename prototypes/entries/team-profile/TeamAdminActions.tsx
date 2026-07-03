'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';
import { EditButton } from '@/components/common/profile/EditButton';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection';

// Reuse the production TeamDetails styling 1:1 (.actions row + .delete color).
import s from '@/components/page/team-details/TeamDetails/TeamDetails.module.scss';
import { FollowToast } from '../follow-shared/FollowToast';

interface Props {
  teamName: string;
}

/**
 * COPY-SIMPLIFY of production TeamDetails' admin actions row (Edit + Delete).
 * Production opens a full `EditTeamDetailsForm` and wires Delete to a server
 * action (`deleteTeam`) + router redirect — both privileged, data-mutating
 * flows out of scope for a mocked prototype. Here both just acknowledge the
 * click with a toast; Delete additionally confirms first, like production.
 */
export function TeamAdminActions({ teamName }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<'edit' | 'delete' | null>(null);

  const showToast = (kind: 'edit' | 'delete') => {
    setToast(kind);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirm = () => {
    setConfirmOpen(false);
    showToast('delete');
  };

  return (
    <>
      <div className={s.actions}>
        <EditButton onClick={() => showToast('edit')} />
        <HeaderActionBtn onClick={() => setConfirmOpen(true)} className={s.delete}>
          <DeleteIcon />
          Delete
        </HeaderActionBtn>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Delete"
        desc={`Are you sure you want to delete the team ${teamName}?`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        confirmTitle="Delete"
      />

      {/* Prototype-only acknowledgement — production opens the edit form / redirects to /teams. */}
      {toast === 'edit' && <FollowToast>Editing isn&apos;t wired up in this prototype.</FollowToast>}
      {toast === 'delete' && <FollowToast>{teamName} deleted (prototype only — no team was actually removed).</FollowToast>}
    </>
  );
}

// Same delete icon production draws inline in TeamDetails.tsx.
const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11.8125 2.625H9.84375V1.96875C9.84375 1.56264 9.68242 1.17316 9.39526 0.885993C9.10809 0.598828 8.71861 0.4375 8.3125 0.4375H5.6875C5.28139 0.4375 4.89191 0.598828 4.60474 0.885993C4.31758 1.17316 4.15625 1.56264 4.15625 1.96875V2.625H2.1875C2.01345 2.625 1.84653 2.69414 1.72346 2.81721C1.60039 2.94028 1.53125 3.1072 1.53125 3.28125C1.53125 3.4553 1.60039 3.62222 1.72346 3.74529C1.84653 3.86836 2.01345 3.9375 2.1875 3.9375H2.40625V11.375C2.40625 11.6651 2.52148 11.9433 2.7266 12.1484C2.93172 12.3535 3.20992 12.4688 3.5 12.4688H10.5C10.7901 12.4688 11.0683 12.3535 11.2734 12.1484C11.4785 11.9433 11.5938 11.6651 11.5938 11.375V3.9375H11.8125C11.9865 3.9375 12.1535 3.86836 12.2765 3.74529C12.3996 3.62222 12.4688 3.4553 12.4688 3.28125C12.4688 3.1072 12.3996 2.94028 12.2765 2.81721C12.1535 2.69414 11.9865 2.625 11.8125 2.625ZM5.46875 1.96875C5.46875 1.91073 5.4918 1.85509 5.53282 1.81407C5.57384 1.77305 5.62948 1.75 5.6875 1.75H8.3125C8.37052 1.75 8.42616 1.77305 8.46718 1.81407C8.5082 1.85509 8.53125 1.91073 8.53125 1.96875V2.625H5.46875V1.96875ZM10.2812 11.1562H3.71875V3.9375H10.2812V11.1562ZM6.34375 5.6875V9.1875C6.34375 9.36155 6.27461 9.52847 6.15154 9.65154C6.02847 9.77461 5.86155 9.84375 5.6875 9.84375C5.51345 9.84375 5.34653 9.77461 5.22346 9.65154C5.10039 9.52847 5.03125 9.36155 5.03125 9.1875V5.6875C5.03125 5.51345 5.10039 5.34653 5.22346 5.22346C5.34653 5.10039 5.51345 5.03125 5.6875 5.03125C5.86155 5.03125 6.02847 5.10039 6.15154 5.22346C6.27461 5.34653 6.34375 5.51345 6.34375 5.6875ZM8.96875 5.6875V9.1875C8.96875 9.36155 8.89961 9.52847 8.77654 9.65154C8.65347 9.77461 8.48655 9.84375 8.3125 9.84375C8.13845 9.84375 7.97153 9.77461 7.84846 9.65154C7.72539 9.52847 7.65625 9.36155 7.65625 9.1875V5.6875C7.65625 5.51345 7.72539 5.34653 7.84846 5.22346C7.97153 5.10039 8.13845 5.03125 8.3125 5.03125C8.48655 5.03125 8.65347 5.10039 8.77654 5.22346C8.89961 5.34653 8.96875 5.51345 8.96875 5.6875Z"
      fill="currentColor"
    />
  </svg>
);
