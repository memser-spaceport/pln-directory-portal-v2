import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Feed } from '@/components/page/forum/Feed';

import s from './page.module.scss';
import { redirect, RedirectType } from 'next/navigation';

const ForumPage = async ({ searchParams }: { searchParams: Record<string, string> }) => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

  if (!searchParams.cid) {
    redirect('/forum?cid=1', RedirectType.replace);
  }

  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <LoggedOutView />
      </div>
    );
  }

  if (userInfo.accessLevel === 'L0' || userInfo.accessLevel === 'L1') {
    return (
      <div className={s.root}>
        <LoggedOutView accessLevel={userInfo.accessLevel} />
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
