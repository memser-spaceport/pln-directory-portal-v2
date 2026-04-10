'use client';

import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';

import { EditIcon, MenuIcon } from '@/components/icons';

import s from './GuideCommentItemMenu.module.scss';

interface Props {
  onEdit: () => void;
  onDelete: () => void;
}

export const GuideCommentItemMenu = ({ onEdit, onDelete }: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (confirmDelete) {
    return (
      <div className={s.confirmRow}>
        <span className={s.confirmLabel}>Delete comment?</span>
        <button
          className={s.confirmYes}
          onClick={() => {
            setConfirmDelete(false);
            onDelete();
          }}
        >
          Delete
        </button>
        <button className={s.confirmNo} onClick={() => setConfirmDelete(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={s.button}>
        <div className={s.buttonIcon}>
          <MenuIcon color="#455468" />
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} align="end">
          <Menu.Popup className={s.popup}>
            <Menu.Item className={s.item} onClick={onEdit}>
              <EditIcon color="#64748B" /> Edit
            </Menu.Item>
            <Menu.Item className={s.item} onClick={() => setConfirmDelete(true)}>
              <TrashIcon /> Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4M6.667 7.333v4M9.333 7.333v4M3.333 4l.667 9.333A1.333 1.333 0 005.333 14.667h5.334a1.333 1.333 0 001.333-1.334L12.667 4"
        stroke="#64748B"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
