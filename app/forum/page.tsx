import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { Feed } from '@/components/page/forum/Feed';

import s from './page.module.scss';

const ForumPage = async () => {
  const { isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <LoggedOutView />
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
