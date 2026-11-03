import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Feed } from '@/components/page/forum/Feed';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';

import s from './page.module.scss';
import { redirect, RedirectType } from 'next/navigation';

const ForumPage = async (props: { searchParams: Promise<Record<string, string>> }) => {
  const searchParams = await props.searchParams;
  const { isLoggedIn } = await getCookiesFromHeaders();

  // A signed-out visitor (and a crawler) gets `/forum` itself: the sign-in view has no categories to pick, and a
  // temporary redirect left the listing without an address of its own (LAB-3091).
  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <h1 className={s.srOnly}>Protocol Labs Forum</h1>
        <LoggedOutView />
      </div>
    );
  }

  // The feed's category tabs read `cid`.
  if (!searchParams.cid) {
    redirect('/forum?cid=0', RedirectType.replace);
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
