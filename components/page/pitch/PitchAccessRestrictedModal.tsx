'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/common/Modal';
import { useContactSupportStore } from '@/services/contact-support/store';
import s from './PitchAccessRestrictedModal.module.scss';

const WarningIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M27.4 22.8L18.7 7.6C18.3 6.9 17.8 6.4 17.1 6.1C16.5 5.8 15.8 5.7 15.1 5.9C14.4 6.1 13.9 6.5 13.5 7.1L4.5 22.7C4.1 23.3 3.9 24 4 24.8C4.1 25.5 4.4 26.1 4.9 26.6C5.4 27.1 6.1 27.4 6.8 27.4H25.4C26.1 27.4 26.8 27.1 27.3 26.5C27.8 26 28.1 25.3 28.1 24.6C28 23.9 27.8 23.3 27.4 22.8ZM16 24C15.4 24 15 23.6 15 23C15 22.4 15.4 22 16 22C16.6 22 17 22.4 17 23C17 23.6 16.6 24 16 24ZM17 19C17 19.6 16.6 20 16 20C15.4 20 15 19.6 15 19V13C15 12.4 15.4 12 16 12C16.6 12 17 12.4 17 13V19Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  isOpen: boolean;
  onClose?: () => void;
};

export const PitchAccessRestrictedModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { openModal } = useContactSupportStore((state) => state.actions);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnBackdropClick={false} className={s.modalContainer}>
      <div className={s.modal}>
        <button className={s.closeButton} onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={s.content}>
          <div className={s.iconContainer}>
            <WarningIcon />
          </div>
          <div className={s.textContent}>
            <h2 className={s.title}>Access Restricted</h2>
            <p className={s.body}>
              This pitch is only available to investors who were invited by the Protocol Labs team.
            </p>
            <p className={s.body}>
              Please make sure you&apos;re signed in with the email address that received the invitation.
            </p>
            <p className={s.body}>If you believe you should have access, contact support.</p>
          </div>
        </div>

        <div className={s.footer}>
          <button className={s.primaryButton} onClick={() => openModal()}>
            Contact support
          </button>
        </div>
      </div>
    </Modal>
  );
};
