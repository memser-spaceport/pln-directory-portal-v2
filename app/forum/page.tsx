import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Feed } from '@/components/page/forum/Feed';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';

import s from './page.module.scss';
import { redirect, RedirectType } from 'next/navigation';

const ForumPage = async ({ searchParams }: { searchParams: Record<string, string> }) => {
  const { isLoggedIn } = getCookiesFromHeaders();

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

  return (
    <ForumAccessGate>
      <div className={s.root}>
        <Feed />
      </div>
    </ForumAccessGate>
  );
};

export default ForumPage;
