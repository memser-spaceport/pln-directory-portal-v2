'use client';

import React from 'react';
import { IKBArticle } from '@/types/knowledge-base.types';
import { IUserInfo } from '@/types/shared.types';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { ArticleHeader } from '@/components/page/knowledge-base/ArticleHeader/ArticleHeader';
import { ArticleBody } from '@/components/page/knowledge-base/ArticleBody/ArticleBody';
import { UpvoteButton } from '@/components/page/knowledge-base/UpvoteButton/UpvoteButton';
import { KBAuthorOfficeHours } from '@/components/page/knowledge-base/KBAuthorOfficeHours/KBAuthorOfficeHours';
import { QASection } from '@/components/page/knowledge-base/QASection/QASection';
import s from './KnowledgeBaseArticlePage.module.scss';

interface Props {
  article: IKBArticle;
  liveOfficeHoursUrl: string | null;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export function KnowledgeBaseArticlePage({ article, liveOfficeHoursUrl, userInfo, isLoggedIn }: Props) {
  const isAdmin = isAdminUser(userInfo);

  return (
    <div className={s.root}>
      <div className={s.layout}>
        {/* Main content */}
        <main className={s.main}>
          <ArticleHeader article={article} isAdmin={isAdmin} />
          <ArticleBody content={article.content} />
          <QASection isLoggedIn={isLoggedIn} articleSlug={article.slug} />
        </main>

        {/* Sidebar */}
        <aside className={s.sidebar}>
          <div className={s.stickyContainer}>
            <UpvoteButton initialCount={article.upvotes} />
            <KBAuthorOfficeHours
              authorName={article.author}
              authorRole={article.authorRole}
              authorImageUrl={article.authorImageUrl}
              officeHoursUrl={liveOfficeHoursUrl}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
