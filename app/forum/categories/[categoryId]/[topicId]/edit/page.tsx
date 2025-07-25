import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import s from './page.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { fetcher as getPost } from '@/services/forum/hooks/useForumPost';
import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    categoryId: string;
    topicId: string;
  };
}

const EditPostPage = async ({ params }: PageProps) => {
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

  const data = await getPost(params.topicId);

  if (!data) {
    redirect(`/forum/categories/${params.categoryId}/${params.topicId}?error=post-not-found`);
  }

  return (
    <div className={s.root}>
      <CreatePost
        pid={data.mainPid}
        isEdit
        initialData={{
          topic: { label: data.category.name, value: data.category.cid.toString() },
          title: data.title,
          content: data.posts[0].content,
        }}
      />
    </div>
  );
};

export default EditPostPage;
