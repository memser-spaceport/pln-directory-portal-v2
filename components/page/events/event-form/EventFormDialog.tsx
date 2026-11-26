'use client';

import { type ReactNode, useEffect, useId } from 'react';

import { Modal } from '@/components/common/Modal';

import s from './EventFormDialog.module.scss';

interface Props {
  title: string;
  onClose: () => void;
  /** A press on the backdrop closes the dialog. Off for a dialog that holds typed text. */
  closeOnBackdropClick?: boolean;
  children?: ReactNode;
  /** The dialog's buttons, at the bottom right. */
  actions: ReactNode;
}

/** A titled dialog of the event form. Closing it puts the focus back where it was when the dialog opened. */
export function EventFormDialog({ title, onClose, closeOnBackdropClick = true, children, actions }: Props) {
  const titleId = useId();

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    // The page is inert until the dialog is gone, so the focus moves back after this commit.
    return () => queueMicrotask(() => opener?.focus?.());
  }, []);

  return (
    <Modal
      isOpen
      onClose={onClose}
      closeOnBackdropClick={closeOnBackdropClick}
      ariaLabelledBy={titleId}
      inertBackground
      lockScroll
    >
      <div className={s.card}>
        <h2 className={s.title} id={titleId}>
          {title}
        </h2>
        {children}
        <div className={s.actions}>{actions}</div>
      </div>
    </Modal>
  );
}
