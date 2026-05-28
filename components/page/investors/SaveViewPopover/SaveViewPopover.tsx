'use client';

import { useState } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import s from './SaveViewPopover.module.scss';

interface Props {
  onSave: (name: string) => void;
  variant?: 'button' | 'link';
}

export function SaveViewPopover({ onSave, variant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleClose = () => {
    setName('');
    setOpen(false);
  };

  const handleSave = () => {
    if (!name.trim() || name.length > 200) return;
    onSave(name.trim());
    handleClose();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={variant === 'link' ? s.triggerLink : s.trigger}>
        {variant === 'button' && <FloppyDiskIcon />}
        Save View
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} align={variant === 'link' ? 'start' : 'end'} sideOffset={8}>
          <Popover.Popup className={s.popup}>
            <div className={s.label}>Name this view</div>
            <input
              autoFocus
              type="text"
              className={s.input}
              placeholder="My filter view…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleClose();
              }}
              maxLength={200}
            />
            {name.length >= 180 && <span className={s.charCount}>{name.length}/200</span>}
            <div className={s.actions}>
              <button className={s.cancelBtn} onClick={handleClose}>
                Cancel
              </button>
              <button className={s.saveBtn} disabled={!name.trim() || name.length > 200} onClick={handleSave}>
                Save
              </button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const FloppyDiskIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
    <path d="M7 3v4a1 1 0 0 0 1 1h7" />
  </svg>
);
