import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Feed } from '@/components/page/forum/Feed';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';

import s from './page.module.scss';
import { redirect, RedirectType } from 'next/navigation';

const ForumPage = async ({ searchParams }: { searchParams: Record<string, string> }) => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

  if (!searchParams.cid) {
    redirect('/forum?cid=0', RedirectType.replace);
  }

  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <LoggedOutView />
      </div>
    );
  }

  if (USE_ACCESS_CONTROL_V2) {
    return (
      <ForumAccessGate>
        <div className={s.root}>
          <Feed />
        </div>
      </ForumAccessGate>
    );
  }

  if (userInfo.accessLevel === 'L0' || userInfo.accessLevel === 'L1' || userInfo.accessLevel === 'L5') {
    return (
      <div className={s.root}>
        <LoggedOutView reason={userInfo.accessLevel === 'L5' ? 'investor' : 'base'} />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <Feed />
    </div>
  );
};

export default ForumPage;
