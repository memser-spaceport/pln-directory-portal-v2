import React, { FC, useEffect } from 'react';
import Image from 'next/image';

import s from './ConfirmDialog.module.css';

interface Props {
  title: string;
  desc: string;
  onClose: () => void;
  onConfirm: () => void;
  isOpen: boolean;
  confirmTitle?: string;
  disabled?: boolean;
}

export const ConfirmDialog: FC<Props> = ({ title, desc, onClose, isOpen, onConfirm, confirmTitle, disabled }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={onClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <h2>{title}</h2>
            <p className={s.confirmationMessage}>{desc}</p>
            <div className={s.dialogControls}>
              <button type="button" className={s.secondaryButton} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={s.errorButton} onClick={onConfirm} disabled={disabled}>
                {confirmTitle}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmDialog;
