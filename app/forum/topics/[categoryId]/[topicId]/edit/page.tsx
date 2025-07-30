import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import { CreatePost } from '@/components/page/forum/CreatePost';
import { TopicResponse } from '@/services/forum/hooks/useForumPost';
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
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
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

  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN ?? authToken;
  const response = await fetch(`${process.env.FORUM_API_URL}/api/topic/${params.topicId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response?.ok) {
    redirect(`/forum/topics/${params.categoryId}/${params.topicId}?error=post-not-found`);
  }

  const data = (await response.json()) as TopicResponse;

  if (!data) {
    redirect(`/forum/topics/${params.categoryId}/${params.topicId}?error=post-not-found`);
  }

  return (
    <div className={s.root}>
      <BackButton to={`/forum/topics/${params.categoryId}/${params.topicId}`} />
      <CreatePost
        pid={data.mainPid}
        isEdit
        initialData={{
          user: isAdmin && data.posts?.[0]?.user ? { label: data.posts[0].user.displayname, value: data.posts[0].user.memberUid } : null,
          topic: { label: data.category.name, value: data.category.cid.toString() },
          title: data.title,
          content: data.posts?.[0]?.content,
        }}
      />
    </div>
  );
};

export default EditPostPage;
