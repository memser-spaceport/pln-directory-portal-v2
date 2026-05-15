'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import s from './InvestorsNoAccessModal.module.scss';

const DISMISSED_KEY = 'investor_db.no_access_modal_dismissed.v1';

/**
 * One-time modal nudging logged-in-but-no-permission users to request access.
 * Mirrors DealsNoAccessModal. Stored dismissal in localStorage so it doesn't
 * re-pop on every visit.
 */
export function InvestorsNoAccessModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    // Slight delay so it doesn't feel jarring
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  const onClose = () => {
    setOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <Drawer isOpen={open} onClose={onClose} width={480}>
      <div className={s.body}>
        <div className={s.icon}>🔒</div>
        <h2 className={s.title}>Investor DB is internal</h2>
        <p className={s.text}>
          You're seeing this because your account doesn't have <code>investor_db.view</code>. The Investor DB is reserved
          for the PL investment team. If you should have access, ask your admin to grant it in RBAC.
        </p>
        <button className={s.btn} onClick={onClose}>
          Got it
        </button>
      </div>
    </Drawer>
  );
}
