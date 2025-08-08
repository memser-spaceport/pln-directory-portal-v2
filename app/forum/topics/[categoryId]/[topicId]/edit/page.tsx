import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import { CreatePost } from '@/components/page/forum/CreatePost';
import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { redirect } from 'next/navigation';
import { ADMIN_ROLE } from '@/utils/constants';

import s from './page.module.scss';
import { BackButton } from '@/components/ui/BackButton';

interface PageProps {
  params: {
    categoryId: string;
    topicId: string;
  };
  searchParams: {
    from?: string;
  };
}

const EditPostPage = async ({ params, searchParams }: PageProps) => {
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
    const redirectUrl = `/forum/topics/${params.categoryId}/${params.topicId}?error=post-not-found${searchParams.from ? `&from=${searchParams.from}` : ''}`;
    redirect(redirectUrl);
  }

  const data = (await response.json()) as TopicResponse;

  if (!data) {
    const redirectUrl = `/forum/topics/${params.categoryId}/${params.topicId}?error=post-not-found${searchParams.from ? `&from=${searchParams.from}` : ''}`;
    redirect(redirectUrl);
  }

  return (
    <div className={s.root}>
      <BackButton to={`/forum/topics/${params.categoryId}/${params.topicId}${searchParams.from ? `?from=${searchParams.from}` : ''}`} />
      <CreatePost
        pid={data.mainPid}
        isEdit
        initialData={{
          user: isAdmin && data.posts?.[0]?.user ? { label: data.posts[0].user.displayname, value: data.posts[0].user.memberUid } : null,
          topic: { label: data.category.name, value: data.category.cid.toString() },
          title: data.title,
          content: data.posts?.[0]?.content,
        }}
        userInfo={userInfo}
      />
    </div>
  );
};

export default EditPostPage;
