import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllArticles } from '../articles.service';
import { ArticlesQueryKeys } from '../constants';
import type { IArticle, IArticlesByCategory } from '@/types/articles.types';

export function useGetArticles() {
  const query = useQuery({
    queryKey: [ArticlesQueryKeys.ARTICLES_LIST],
    queryFn: getAllArticles,
    staleTime: 60_000,
    gcTime: 120_000,
  });

  const articles: IArticle[] = query.data?.data ?? [];

  const byCategory: IArticlesByCategory[] = useMemo(() => {
    const map = new Map<string, IArticle[]>();
    articles.forEach((a) => {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, articles: items }));
  }, [articles]);

  return { articles, byCategory, isLoading: query.isLoading, isError: query.isError };
}
