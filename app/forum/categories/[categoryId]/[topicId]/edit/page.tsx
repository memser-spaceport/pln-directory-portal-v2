import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { LoggedOutView } from '@/components/page/forum/LoggedOutView';

import s from './page.module.scss';
import { CreatePost } from '@/components/page/forum/CreatePost';
import { fetcher as getPost } from '@/services/forum/hooks/useForumPost';
import { redirect } from 'next/navigation';
import { BreadCrumb } from '@/components/core/bread-crumb';
import { ADMIN_ROLE } from '@/utils/constants';

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
    redirect(`/forum/categories/${params.categoryId}/${params.topicId}?error=post-not-found`);
  }

  return (
    <>
      <div className={s.breadcrumbs}>
        <BreadCrumb backLink={`/forum/categories/${params.categoryId}/${params.topicId}`} directoryName={data.title} pageName="Edit Post" />
      </div>
      <div className={s.root}>
        <CreatePost
          pid={data.mainPid}
          isEdit
          initialData={{
            user: isAdmin ? { label: data.posts[0].user.displayname, value: data.posts[0].user.memberUid } : null,
            topic: { label: data.category.name, value: data.category.cid.toString() },
            title: data.title,
            content: data.posts[0]?.content,
          }}
        />
      </div>
    </>
  );
};

export default EditPostPage;
