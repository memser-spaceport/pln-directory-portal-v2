import React from 'react';
import { redirect } from 'next/navigation';

import { fetchForumTopic } from '@/services/forum/forum-nodebb.server';
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
  params: Promise<{
    categoryId: string;
    topicId: string;
  }>;
  searchParams: Promise<{
    from?: string;
  }>;
}

const EditPostPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { isLoggedIn, userInfo } = await getCookiesFromHeaders();
  const isAdmin = isAdminUser(userInfo);

  if (!isLoggedIn) {
    return (
      <div className={s.root}>
        <LoggedOutView />
      </div>
    );
  }

  const response = await fetchForumTopic(params.topicId);

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
      />
    </div>
  );

  if (USE_ACCESS_CONTROL_V2) {
    return <ForumWriteGate>{content}</ForumWriteGate>;
  }

  return content;
};

export default EditPostPage;
