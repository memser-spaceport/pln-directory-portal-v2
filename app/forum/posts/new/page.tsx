import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { ForumAccessGate } from '@/components/page/forum/ForumAccessGate/ForumAccessGate';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';

import s from './page.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { BackButton } from '@/components/ui/BackButton';

const NewPostPage = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

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
          <BackButton forceTo to="/forum?cid=0" />
          <CreatePost userInfo={userInfo} />
        </div>
      </ForumAccessGate>
    );
  }

  if (userInfo.accessLevel === 'L0' || userInfo.accessLevel === 'L1') {
    return (
      <div className={s.root}>
        <LoggedOutView reason="base" />
      </div>
    );
  }

  return (
    <div className={s.root}>
      <BackButton forceTo to="/forum?cid=0" />
      <CreatePost userInfo={userInfo} />
    </div>
  );
};

export default NewPostPage;
