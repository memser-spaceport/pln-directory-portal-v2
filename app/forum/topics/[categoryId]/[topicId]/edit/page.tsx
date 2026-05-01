import React from 'react';
import { redirect } from 'next/navigation';

import { TopicResponse } from '@/services/forum/hooks/useForumPost';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';

import { BackButton } from '@/components/ui/BackButton';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';
import { ForumWriteGate } from '@/components/page/forum/ForumWriteGate/ForumWriteGate';

import s from './page.module.scss';

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
  const isAdmin = isAdminUser(userInfo);

  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <LoggedOutView />
      </div>
    );
  }

  if (!USE_ACCESS_CONTROL_V2 && (userInfo.accessLevel === 'L0' || userInfo.accessLevel === 'L1')) {
    return (
      <div className={s.root}>
        <LoggedOutView reason="base" />
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

  const content = (
    <div className={s.root}>
      <BackButton forceTo to="/forum?cid=0" />
      <CreatePost
        pid={data.mainPid}
        isEdit
        initialData={{
          user:
            isAdmin && data.posts?.[0]?.user
              ? { label: data.posts[0].user.displayname, value: data.posts[0].user.memberUid }
              : null,
          topic: { label: data.category.name, value: data.category.cid.toString() },
          title: data.title,
          content: data.posts?.[0]?.content,
        }}
        userInfo={userInfo}
      />
    </div>
  );

  if (USE_ACCESS_CONTROL_V2) {
    return <ForumWriteGate>{content}</ForumWriteGate>;
  }

  return content;
};

export default EditPostPage;
