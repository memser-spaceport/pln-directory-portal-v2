'use client';

import Image from 'next/image';
import { ReactNode, RefObject } from 'react';

import DialogLoader from '../dialog-loader';

import s from './Modal.module.scss';

interface Props {
  onClose: (e?: any) => void;
  children: ReactNode;
  modalRef: RefObject<HTMLDialogElement>;
}

export function Modal(props: Props) {
  const { onClose, children, modalRef } = props;

  return (
    <dialog autoFocus={true} ref={modalRef} className={s.modal}>
      <DialogLoader />
      {/* for skip button focus */}
      <button className={s.hiddenBtn}></button>
      <div className={s.content}>
        <button type="button" className={s.closeBtn} onClick={onClose}>
          <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
        </button>
        {children}
      </div>
    </dialog>
  );
}

