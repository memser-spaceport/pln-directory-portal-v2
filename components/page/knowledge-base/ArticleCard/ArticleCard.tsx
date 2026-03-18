import React from 'react';
import Link from 'next/link';
import { IKBArticleMeta } from '@/types/knowledge-base.types';
import s from './ArticleCard.module.scss';

interface Props {
  article: IKBArticleMeta;
}

export function ArticleCard({ article }: Props) {
  const updatedDate = new Date(article.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
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
    <Link href={`/knowledge-base/${article.slug}`} className={s.root}>
      <div className={s.top}>
        <span className={s.category}>{article.category}</span>
        <span className={s.readingTime}>
          <ClockIcon /> {article.readingTime} min read
        </span>
      </div>

      <h3 className={s.title}>{article.title}</h3>
      <p className={s.summary}>{article.summary}</p>

      <div className={s.tags}>
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className={s.tag}>
            {tag}
          </span>
        ))}
        {article.tags.length > 3 && (
          <span className={s.tag}>+{article.tags.length - 3}</span>
        )}
      </div>

      <div className={s.footer}>
        <div className={s.author}>
          {article.authorImageUrl ? (
            <img src={article.authorImageUrl} alt={article.author} className={s.avatar} />
          ) : (
            <div className={s.avatarFallback}>{initials}</div>
          )}
          <div className={s.authorInfo}>
            <span className={s.authorName}>{article.author}</span>
            <span className={s.updatedDate}>Updated {updatedDate}</span>
          </div>
        </div>

        <div className={s.stats}>
          <span className={s.stat}>
            <EyeIcon /> {article.viewCount}
          </span>
          <span className={s.stat}>
            <UpvoteIcon /> {article.upvotes}
          </span>
        </div>
      </div>
    </Link>
  );
}

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.5 2.5C3.5 2.5 1 6.5 1 6.5C1 6.5 3.5 10.5 6.5 10.5C9.5 10.5 12 6.5 12 6.5C12 6.5 9.5 2.5 6.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const UpvoteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 2L9.5 6H7.5V11H5.5V6H3.5L6.5 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);
