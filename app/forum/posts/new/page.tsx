import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import s from './page.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';

const NewPostPage = async () => {
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
      <CreatePost />
    </div>
  );
};

export default NewPostPage;
