import React from 'react';
import { Post } from '@/components/page/forum/Post';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import s from '@/app/forum/page.module.scss';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

const PostPage = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

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

  return <Post />;
};

export default PostPage;
