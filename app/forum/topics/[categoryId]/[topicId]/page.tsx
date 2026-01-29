import React from 'react';
import { Post } from '@/components/page/forum/Post';
import s from '@/app/forum/page.module.scss';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

const PostPage = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

  if (userInfo.accessLevel === 'L0' || userInfo.accessLevel === 'L1' || userInfo.accessLevel === 'L5') {
    return (
      <div className={s.root}>
        <LoggedOutView accessLevel={userInfo.accessLevel} />
      </div>
    );
  }

  return <Post />;
};

export default PostPage;
