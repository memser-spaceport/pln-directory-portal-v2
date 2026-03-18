import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { getArticleBySlug } from '@/utils/knowledge-base.utils';
import { AdminArticleForm } from '@/components/page/knowledge-base/AdminArticleForm';

interface Props {
  params: { slug: string };
}

export const metadata = {
  title: 'Edit Article | Knowledge Base Admin',
};

const EditArticlePage = async ({ params }: Props) => {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn || !isAdminUser(userInfo)) {
    redirect('/knowledge-base');
  }

  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return <AdminArticleForm mode="edit" article={article} />;
};

export default EditArticlePage;
