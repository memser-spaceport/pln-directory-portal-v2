'use client';

import { useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { useContactSupportStore } from '@/services/contact-support/store';
import s from './DealsNoAccessModal.module.scss';
import { WarningCircleIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';

const DEALS_LOGIN_INTENT_KEY = 'dealsLoginIntent';

export function DealsNoAccessModal() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasIntent = sessionStorage.getItem(DEALS_LOGIN_INTENT_KEY) === '1';
    if (hasIntent) sessionStorage.removeItem(DEALS_LOGIN_INTENT_KEY);
    return hasIntent;
  });
  const { actions } = useContactSupportStore();

  return (
    <Modal isOpen={visible} onClose={() => setVisible(false)} className={s.card} closeOnBackdropClick={false}>
      <div className={s.iconWrap}>
        <WarningCircleIcon />
      </div>
      <h2 className={s.title}>Access Denied</h2>
      <p className={s.body}>
        You have an account with us, but you don&apos;t have access to Deals yet. Contact our support team if you
        believe this is an error.
      </p>
      <Button style="fill" variant="primary" className={s.gotItBtn} onClick={() => setVisible(false)}>
        Got it
      </Button>
      <Button
        style="link"
        variant="primary"
        className={s.contactLink}
        onClick={() => {
          actions.openModal();
          setVisible(false);
        }}
      >
        Contact Support
      </Button>
    </Modal>
  );
}

const ExclamationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9V13M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
