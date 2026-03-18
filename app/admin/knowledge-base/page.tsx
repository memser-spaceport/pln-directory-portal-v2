import React from 'react';
import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { getAllArticles } from '@/utils/knowledge-base.utils';
import { AdminKBListPage } from '@/components/page/knowledge-base/AdminKBListPage';

export const metadata = {
  title: 'Knowledge Base Admin | Protocol Labs',
};

const AdminKBPage = async () => {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn || !isAdminUser(userInfo)) {
    redirect('/knowledge-base');
  }

  const articles = getAllArticles();

  return <AdminKBListPage articles={articles} />;
};

export default AdminKBPage;
