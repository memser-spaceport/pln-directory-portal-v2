'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFounderGuidesCreateAccess } from '@/services/rbac/hooks/useFounderGuidesCreateAccess';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useCurrentUserStore } from '@/services/auth/store';
import { canEditArticle } from '@/components/page/founder-guides/ArticleContent/helpers';
import { IArticle } from '@/types/articles.types';

interface Props {
  slug: string;
  children: (article: IArticle) => ReactNode;
}

export function FounderGuidesEditGuard({ slug, children }: Props) {
  const router = useRouter();
  const { canCreate, isLoading: rbacLoading, isError: rbacError } = useFounderGuidesCreateAccess();
  const { articles, isLoading: articlesLoading, isError: articlesError } = useGetArticles();
  const { currentUser: userInfo } = useCurrentUserStore();

  const isLoading = rbacLoading || articlesLoading;
  const isError = rbacError || articlesError;
  const article = articles.find((a) => a.slugURL === slug);
  const hasAccess = article ? canEditArticle(article, userInfo, canCreate) : false;

  useEffect(() => {
    if (!isLoading && !isError && (!article || !hasAccess)) {
      router.replace('/founder-guides');
    }
  }, [isLoading, isError, article, hasAccess, router]);

  if (isLoading || (!hasAccess && !isError)) {
    return null;
  }

  if (!article) {
    return null;
  }

  return <>{children(article)}</>;
}
