import React from 'react';
import { Post } from '@/components/page/forum/Post';
import s from '@/app/forum/page.module.scss';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';

const PostPage = async () => {
  const { userInfo } = getCookiesFromHeaders();

  if (USE_ACCESS_CONTROL_V2) {
    return (
      <ForumAccessGate>
        <Post />
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

  return <Post />;
};

export default PostPage;
