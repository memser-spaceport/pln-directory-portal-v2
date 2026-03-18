import React from 'react';
import Link from 'next/link';
import { IKBArticle } from '@/types/knowledge-base.types';
import { ArticleStats } from '@/components/page/knowledge-base/ArticleStats/ArticleStats';
import s from './ArticleHeader.module.scss';

interface Props {
  article: IKBArticle;
  isAdmin: boolean;
}

export function ArticleHeader({ article, isAdmin }: Props) {
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const initials = article.author
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={s.root}>
      {/* Breadcrumb */}
      <div className={s.breadcrumb}>
        <Link href="/knowledge-base" className={s.breadcrumbLink}>
          Knowledge Base
        </Link>
        <ChevronIcon />
        <span className={s.breadcrumbCategory}>{article.category}</span>
      </div>

      {/* Category + Admin */}
      <div className={s.topRow}>
        <span className={s.category}>{article.category}</span>
        {isAdmin && (
          <Link href={`/admin/knowledge-base/edit/${article.slug}`} className={s.editLink}>
            <EditIcon /> Edit Article
          </Link>
        )}
      </div>

      {/* Title */}
      <h1 className={s.title}>{article.title}</h1>

      {/* Author row */}
      <div className={s.authorRow}>
        {article.authorImageUrl ? (
          <img src={article.authorImageUrl} alt={article.author} className={s.avatar} />
        ) : (
          <div className={s.avatarFallback}>{initials}</div>
        )}
        <div className={s.authorMeta}>
          <span className={s.authorName}>{article.author}</span>
          {article.authorRole && <span className={s.authorRole}>{article.authorRole}</span>}
        </div>
        <span className={s.publishedDate}>Published {publishedDate}</span>
      </div>

      {/* Stats */}
      <ArticleStats
        viewCount={article.viewCount}
        readingTime={article.readingTime}
        updatedAt={article.updatedAt}
      />

      {/* Tags */}
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
  );
}

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4 2.5L7.5 6L4 9.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M9.5 1.5L11.5 3.5L4.5 10.5H2.5V8.5L9.5 1.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
