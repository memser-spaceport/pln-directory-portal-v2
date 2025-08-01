import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import s from './page.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { BreadCrumb } from '@/components/core/bread-crumb';
import { BackButton } from '@/components/page/forum/BackButton';

const NewPostPage = async () => {
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

  return (
    <div className={s.root}>
      <BackButton to="/forum?cid=0" />
      <CreatePost userInfo={userInfo} />
    </div>
  );
};

export default NewPostPage;
