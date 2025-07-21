import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import s from './page.module.scss';
import { PostsList } from '@/components/page/forum/PostsList';

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
      <PostsList />
    </div>
  );
};

export default ForumPage;
