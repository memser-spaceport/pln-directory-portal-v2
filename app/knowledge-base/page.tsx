import React from 'react';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getAllArticles } from '@/utils/knowledge-base.utils';
import { KnowledgeBaseListPage } from '@/components/page/knowledge-base/KnowledgeBaseListPage';

import s from './page.module.scss';

export const metadata = {
  title: 'Knowledge Base | Protocol Labs',
  description: 'Founder resources, guides, and playbooks from the Protocol Labs ecosystem.',
};

const KnowledgeBasePage = async () => {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  const articles = getAllArticles();

  return (
    <div className={s.root}>
      <KnowledgeBaseListPage articles={articles} userInfo={userInfo} isLoggedIn={isLoggedIn} />
    </div>
  );
};

export default KnowledgeBasePage;
