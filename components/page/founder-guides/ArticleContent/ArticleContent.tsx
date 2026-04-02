'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { slugifyHeading, getTextFromChildren } from '@/utils/markdown';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useArticleView } from '@/services/articles/hooks/useArticleView';
import { useArticleLike } from '@/services/articles/hooks/useArticleLike';
import { getCookiesFromClient } from '@/utils/third-party.helper';
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

function ThumbsUpIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M5 14V7.5L7.5 2.5C8.052 2.5 8.5 2.948 8.5 3.5V5.5H12C12.552 5.5 13 5.948 13 6.5L11.5 11V13C11.5 13.552 11.052 14 10.5 14H5M5 14H3C2.448 14 2 13.552 2 13V8C2 7.448 2.448 7 3 7H5"
        stroke={filled ? '#1b4dff' : '#8897ae'}
        fill={filled ? 'rgba(27, 77, 255, 0.12)' : 'none'}
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

function CalendarBlankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" stroke="white" strokeWidth="1.5" />
      <path d="M2.5 7.5H15.5" stroke="white" strokeWidth="1.5" />
      <path d="M6 1.5V4.5M12 1.5V4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DotSepLarge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="2.5" fill="#455468" />
    </svg>
  );
}

export default function ArticleContent({ slug }: ArticleContentProps) {
  const router = useRouter();
  const { articles, isLoading, isError } = useGetArticles();
  const viewMutation = useArticleView();
  const likeMutation = useArticleLike();
  const viewTracked = useRef(false);

  const article = articles.find((a) => a.slugURL === slug);

  const { userInfo } = getCookiesFromClient();
  const isAuthenticated = !!userInfo;

  useEffect(() => {
    if (!isLoading && !isError && articles.length > 0 && !article) {
      router.replace('/founder-guides');
    }
  }, [isLoading, isError, articles.length, article, router]);

  useEffect(() => {
    if (article && isAuthenticated && !viewTracked.current) {
      viewTracked.current = true;
      viewMutation.mutate(article.uid);
    }
  }, [article, isAuthenticated]);

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

  const isTeamAuthor = !!article.authorTeam && !article.authorMember;
  const authorName = article.authorMember?.name || article.authorTeam?.name || 'Unknown';
  const authorImage = isTeamAuthor ? article.authorTeam?.logo?.url : article.authorMember?.image;
  const authorLogo = article.authorTeam?.logo?.url || null;
  const initials = authorName.slice(0, 2).toUpperCase();
  const officeHoursUrl = article.authorMember?.officeHours || article.authorTeam?.officeHours || null;

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
              {isAuthenticated ? (
                <button
                  className={`${s.statItem} ${s.likeButton} ${article.isLiked ? s.liked : ''}`}
                  onClick={() => likeMutation.mutate({ uid: article.uid, isLiked: article.isLiked })}
                  disabled={likeMutation.isPending}
                  aria-pressed={article.isLiked}
                  aria-label={article.isLiked ? 'Unlike this article' : 'Like this article'}
                >
                  <ThumbsUpIcon filled={article.isLiked} />
                  {formatCount(article.totalLikes)} Likes
                </button>
              ) : (
                <span className={s.statItem}>
                  <ThumbsUpIcon />
                  {formatCount(article.totalLikes)} Likes
                </span>
              )}
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
          <ReactMarkdown
            components={{
              h2: ({ children, ...props }) => {
                const text = getTextFromChildren(children);
                const id = slugifyHeading(text);
                return (
                  <h2 id={id} {...props}>
                    {children}
                  </h2>
                );
              },
            }}
          >
            {article.content}
          </ReactMarkdown>
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

        {officeHoursUrl && (
          <>
            <hr className={s.divider} />
            <div className={s.ohBanner}>
              <div className={s.ohLeft}>
                <div className={s.ohAvatarWrap}>
                  {authorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={authorImage} alt={authorName} className={s.ohAvatar} />
                  ) : (
                    <div className={s.ohInitial}>{initials}</div>
                  )}
                </div>
                <div className={s.ohInfo}>
                  <div className={s.ohNameRow}>
                    <span className={s.ohName}>{authorName}</span>
                    {article.authorTeam?.name && article.authorMember?.name && (
                      <>
                        <DotSepLarge />
                        <span className={s.ohRole}>@{article.authorTeam.name}</span>
                      </>
                    )}
                  </div>
                  <span className={s.ohSubtitle}>
                    {isTeamAuthor
                      ? 'Schedule a meeting with this team.'
                      : 'Available for 1:1 call — no introduction needed.'}
                  </span>
                </div>
              </div>
              <a href={officeHoursUrl} target="_blank" rel="noopener noreferrer" className={s.ohButton}>
                <CalendarBlankIcon />
                Schedule Meeting
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
