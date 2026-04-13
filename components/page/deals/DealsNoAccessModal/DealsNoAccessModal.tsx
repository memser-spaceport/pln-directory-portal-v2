'use client';

import { useState } from 'react';

import { useContactSupportStore } from '@/services/contact-support/store';
import s from './DealsNoAccessModal.module.scss';

const DEALS_LOGIN_INTENT_KEY = 'dealsLoginIntent';

export function DealsNoAccessModal() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hasIntent = sessionStorage.getItem(DEALS_LOGIN_INTENT_KEY) === '1';
    if (hasIntent) sessionStorage.removeItem(DEALS_LOGIN_INTENT_KEY);
    return hasIntent;
  });
  const { actions } = useContactSupportStore();

  if (!visible) return null;

  return (
    <div className={s.overlay}>
      <div className={s.card}>
        <div className={s.iconWrap}>
          <LockIcon />
        </div>
        <h2 className={s.title}>Deals Access Unavailable</h2>
        <p className={s.body}>You don&apos;t have access to Deals yet.</p>
        <div className={s.actions}>
          <button className={s.primaryBtn} onClick={() => actions.openModal()}>
            Contact us
          </button>
          <button className={s.secondaryBtn} onClick={() => setVisible(false)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#156FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#156FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="16" r="1.5" fill="#156FF7" />
  </svg>
);
