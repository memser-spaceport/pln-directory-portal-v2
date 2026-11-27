'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/common/Button';
import { useMyInviteLink } from '@/services/members/hooks/useMyInviteLink';
import type { IUserInfo } from '@/types/shared.types';
import { triggerLoader } from '@/utils/common.utils';
// The settings tab frame and card that Connected Accounts uses.
import tab from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';

import { InviteLinkCard } from './InviteLinkCard';

/** Settings → Invite (LAB-3398). It shows only the live link from the API, never a link of its own. */
export function InviteSettings({ userInfo }: { userInfo: IUserInfo }) {
  const router = useRouter();
  const { data, isError, refetch, isFetching } = useMyInviteLink(userInfo?.uid);

  useEffect(() => {
    triggerLoader(false);
    const onNavigate = (e: Event) => {
      triggerLoader(true);
      router.push((e as CustomEvent<{ url: string }>).detail.url);
      router.refresh();
    };
    document.addEventListener('settings-navigate', onNavigate);
    return () => document.removeEventListener('settings-navigate', onNavigate);
  }, [router]);

  return (
    <div className={tab.root}>
      <h5 className={tab.title}>Invite to LabOS</h5>
      <div className={tab.card} aria-busy={!data && !isError}>
        <div className={tab.cardHeader}>Your invite link</div>
        <div className={tab.cardContent}>
          {data && <InviteLinkCard inviteUrl={data.inviteUrl} />}
          {isError && !data && (
            <div role="alert">
              <p>We cannot show your invite link now. Try again.</p>
              <Button variant="secondary" size="m" onClick={() => refetch()} disabled={isFetching}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
