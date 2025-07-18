'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import s from './ConnectedAccounts.module.scss';
import { triggerLoader } from '@/utils/common.utils';
import LinkAuthAccounts from '@/components/page/member-info/link-auth-accounts';

export const ConnectedAccounts = () => {
  const router = useRouter();

  useEffect(() => {
    triggerLoader(false);
    function handleNavigate(e: any) {
      const url = e.detail.url;

      triggerLoader(true);

      router.push(url);
      router.refresh();
    }

    document.addEventListener('settings-navigate', handleNavigate);

    return function () {
      document.removeEventListener('settings-navigate', handleNavigate);
    };
  }, [router]);

  return (
    <div className={s.root}>
      <h5 className={s.title}>Connected Accounts</h5>
      <LinkAuthAccounts />
    </div>
  );
};
