'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import s from './ArticleContent.module.scss';

interface ArticleContentProps {
  slug: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ArticleContent({ slug }: ArticleContentProps) {
  const router = useRouter();
  const { articles, isLoading, isError } = useGetArticles();

  const article = articles.find((a) => a.slugURL === slug);

  useEffect(() => {
    if (!isLoading && !isError && articles.length > 0 && !article) {
      router.replace('/founder-guides');
    }
  }, [isLoading, isError, articles.length, article, router]);

  if (isLoading) {
    return (
      <div className={s.root}>
        <div className={s.card}>
          <div className={s.skeletonTitle} />
          <div className={s.skeletonMeta} />
          <div className={s.skeletonBody} />
          <div className={s.skeletonBody} style={{ width: '80%' }} />
          <div className={s.skeletonBody} style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return null;
  }

  const authorName = article.authorTeam?.name || article.authorMember?.name || 'Unknown';
  const authorLogo = article.authorTeam?.logo?.url || null;

  return (
    <div className={s.root}>
      <div className={s.card}>
        <header className={s.header}>
          <div className={s.meta}>
            <span className={s.categoryBadge}>{article.category}</span>
            <span className={s.dot}>·</span>
            <span className={s.readingTime}>{article.readingTime} min read</span>
            <span className={s.dot}>·</span>
            <span className={s.date}>{formatDate(article.publishedAt)}</span>
          </div>

          <h1 className={s.title}>{article.title}</h1>

          {article.summary && <p className={s.summary}>{article.summary}</p>}

          <div className={s.author}>
            {authorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorLogo} alt={authorName} className={s.authorLogo} />
            ) : (
              <div className={s.authorInitial}>{authorName.charAt(0).toUpperCase()}</div>
            )}
            <span className={s.authorName}>{authorName}</span>
          </div>
        </header>

        <hr className={s.divider} />

        <div className={s.content}>
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        {article.tags.length > 0 && (
          <div className={s.tags}>
            {article.tags.map((tag) => (
              <span key={tag} className={s.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
