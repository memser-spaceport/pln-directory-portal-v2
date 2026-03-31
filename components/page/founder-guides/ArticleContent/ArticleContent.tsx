'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import s from './ArticleContent.module.scss';

interface ArticleContentProps {
  slug: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function ThumbsUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 14V7.5L7.5 2.5C8.052 2.5 8.5 2.948 8.5 3.5V5.5H12C12.552 5.5 13 5.948 13 6.5L11.5 11V13C11.5 13.552 11.052 14 10.5 14H5M5 14H3C2.448 14 2 13.552 2 13V8C2 7.448 2.448 7 3 7H5"
        stroke="#8897ae"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M1.5 8C1.5 8 3.5 3.5 8 3.5C12.5 3.5 14.5 8 14.5 8C14.5 8 12.5 12.5 8 12.5C3.5 12.5 1.5 8 1.5 8Z"
        stroke="#8897ae"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.75" stroke="#8897ae" strokeWidth="1.3" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="9" r="5" stroke="#8897ae" strokeWidth="1.3" />
      <path d="M8 6.5V9L9.5 10" stroke="#8897ae" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 2H10" stroke="#8897ae" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#8897ae" strokeWidth="1.3" />
      <path d="M2 7H14" stroke="#8897ae" strokeWidth="1.3" />
      <path d="M5 1.5V4M11 1.5V4" stroke="#8897ae" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function DotSep() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="1.5" fill="#8897ae" />
    </svg>
  );
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
  const initials = authorName.slice(0, 2).toUpperCase();

  return (
    <div className={s.root}>
      <BackButton to="/founder-guides" className={s.backButton} />
      <div className={s.card}>
        <header className={s.header}>
          {/*<span className={s.categoryBadge}>{article.category}</span>*/}

          <h1 className={s.title}>{article.title}</h1>

          {article.summary && <p className={s.summary}>{article.summary}</p>}

          {/* Details bar: author + stats */}
          <div className={s.details}>
            <div className={s.authorDetails}>
              {authorLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorLogo} alt={authorName} className={s.authorAvatar} />
              ) : (
                <div className={s.authorInitial}>{initials}</div>
              )}
              <span className={s.authorName}>{authorName}</span>
            </div>

            <div className={s.detailsDivider} />

            <div className={s.stats}>
              <span className={s.statItem}>
                <ThumbsUpIcon />
                {formatCount(article.totalLikes)} Likes
              </span>
              <DotSep />
              <span className={s.statItem}>
                <EyeIcon />
                {formatCount(article.totalViews)} Views
              </span>
              <DotSep />
              <span className={s.statItem}>
                <TimerIcon />
                {article.readingTime} min read
              </span>
              <DotSep />
              <span className={s.statItem}>
                <CalendarIcon />
                Updated {formatDate(article.publishedAt)}
              </span>
            </div>
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
