import React, { FC, useState } from 'react';

import Image from 'next/image';

import s from './EditAskDialog.module.css';
import { clsx } from 'clsx';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
}

export const EditAskDialog: FC<Props> = ({ toggleVariant = 'primary' }) => {
  const [open, toggleOpen] = useState(false);

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
          </div>
        </div>
      )}
    </>
  );
};
