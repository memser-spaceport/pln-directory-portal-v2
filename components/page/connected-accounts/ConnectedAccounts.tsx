'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import s from './ConnectedAccounts.module.scss';
import { triggerLoader } from '@/utils/common.utils';
import LinkAuthAccounts from '@/components/page/member-info/link-auth-accounts';
import { McpSection } from '@/components/page/connected-accounts/McpSection';
import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { IUserInfo } from '@/types/shared.types';
// Lives with the prototype it was designed in, which renders the same component.
import { EmailIdentityRow } from '@/prototypes/entries/settings-contact-details/EmailIdentityRow';

export const ConnectedAccounts = ({ userInfo }: { userInfo: IUserInfo }) => {
  const router = useRouter();
  const { canConnect } = useMcpAccess();
  // The address the member signs in with, straight from the session cookie the auth layer
  // validates on every request — no extra member fetch for one field.
  const { uid, email } = userInfo;

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

      {/* Email leads: it is not one more connected account, it is the login itself. */}
      {uid && email && (
        <div className={s.card}>
          <div className={s.cardHeader}>Email</div>
          <div className={s.cardContent}>
            <EmailIdentityRow uid={uid} email={email} userInfo={userInfo} />
          </div>
        </div>
      )}

      <LinkAuthAccounts />
      {canConnect && <McpSection />}
    </div>
  );
};
