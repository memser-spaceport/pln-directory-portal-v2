import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import { CreatePost } from '@/components/page/forum/CreatePost';
import { fetcher as getPost } from '@/services/forum/hooks/useForumPost';
import { redirect } from 'next/navigation';
import { ADMIN_ROLE } from '@/utils/constants';
import { BackButton } from '@/components/page/forum/BackButton';

import s from './page.module.scss';

interface PageProps {
  params: {
    categoryId: string;
    topicId: string;
  };
}

const EditPostPage = async ({ params }: PageProps) => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));

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

  const data = await getPost(params.topicId);

  if (!data) {
    redirect(`/forum/topics/${params.categoryId}/${params.topicId}?error=post-not-found`);
  }

  return (
    <div className={s.root}>
      <BackButton to={`/forum/topics/${params.categoryId}/${params.topicId}`} />
      <CreatePost
        userInfo={userInfo}
        // pid={data.mainPid}
        // isEdit
        // initialData={{
        //   user: isAdmin && data.posts?.[0]?.user ? { label: data.posts[0].user.displayname, value: data.posts[0].user.memberUid } : null,
        //   topic: { label: data.category.name, value: data.category.cid.toString() },
        //   title: data.title,
        //   content: data.posts?.[0]?.content,
        // }}
      />
    </div>
  );
};

export default EditPostPage;
