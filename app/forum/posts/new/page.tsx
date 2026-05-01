import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { ForumWriteGate } from '@/components/page/forum/ForumWriteGate/ForumWriteGate';

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
      <ForumWriteGate>
        <div className={s.root}>
          <BackButton forceTo to="/forum?cid=0" />
          <CreatePost userInfo={userInfo} />
        </div>
      </ForumWriteGate>
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
