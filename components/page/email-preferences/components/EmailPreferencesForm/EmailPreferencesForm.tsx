'use client';

import React, { useEffect } from 'react';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { ForumDigest } from '@/components/page/email-preferences/components/ForumDigest';
import s from './EmailPreferencesForm.module.scss';

interface Props {
  uid: string;
  userInfo: IUserInfo;
}

export const EmailPreferencesForm = ({ uid, userInfo }: Props) => {
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
      <h5 className={s.title}>Email Preferences</h5>
      <ForumDigest userInfo={userInfo} />
    </div>
  );
};
