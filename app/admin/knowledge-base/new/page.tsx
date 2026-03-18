import React from 'react';
import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { AdminArticleForm } from '@/components/page/knowledge-base/AdminArticleForm';

export const metadata = {
  title: 'New Article | Knowledge Base Admin',
};

const NewArticlePage = async () => {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn || !isAdminUser(userInfo)) {
    redirect('/knowledge-base');
  }

  return <AdminArticleForm mode="create" />;
};

export default NewArticlePage;
