import React, { FC, useState } from 'react';

import s from './SubmitAskDialog.module.css';
import { clsx } from 'clsx';

interface Props {
  toggleVariant?: 'primary' | 'secondary';
}

export const SubmitAskDialog: FC<Props> = ({ toggleVariant = 'primary' }) => {
  const [open, toggleOpen] = useState(false);

  return (
    <>
      <button
        className={clsx(s.toggleButton, {
          [s.secondary]: toggleVariant === 'secondary',
        })}
        onClick={() => toggleOpen(true)}
      >
        Submit Asks
      </button>
    </>
  );
};
