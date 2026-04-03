'use client';

import { useRouter } from 'next/navigation';
import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'md-editor-rt/lib/preview.css';
import { slugifyHeading } from '@/utils/markdown';
import { useQuery } from '@tanstack/react-query';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useArticleView } from '@/services/articles/hooks/useArticleView';
import { useArticleLike } from '@/services/articles/hooks/useArticleLike';
import { getMemberInfo } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import { useFounderGuidesCreateAccess } from '@/services/rbac/hooks/useFounderGuidesCreateAccess';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { BackButton } from '@/components/ui/BackButton/BackButton';
import { canEditArticle } from './helpers';
import s from './ArticleContent.module.scss';

const MdPreview = dynamic(() => import('md-editor-rt').then((mod) => mod.MdPreview), { ssr: false });

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

function resolveMemberImageUrl(image: string | { url: string } | null | undefined): string | null {
  if (image == null) return null;
  if (typeof image === 'string') return image;
  return image.url ?? null;
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

function ThumbsUpBoldIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M5.625 15.75V8.438L8.438 2.813C9.057 2.813 9.563 3.318 9.563 3.938V6.188H13.5C14.121 6.188 14.625 6.692 14.625 7.313L12.938 12.375V14.625C12.938 15.246 12.434 15.75 11.813 15.75H5.625M5.625 15.75H3.375C2.754 15.75 2.25 15.246 2.25 14.625V9C2.25 8.379 2.754 7.875 3.375 7.875H5.625"
        stroke={filled ? '#1b4dff' : '#455468'}
        fill={filled ? 'rgba(27, 77, 255, 0.12)' : 'none'}
        strokeWidth="1.5"
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

function NotePencilIcon() {
  return (
    <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          d="M16.3782 3.90295L14.1282 1.65295C14.0498 1.57429 13.9567 1.51188 13.8541 1.46929C13.7516 1.42671 13.6416 1.40479 13.5305 1.40479C13.4195 1.40479 13.3095 1.42671 13.207 1.46929C13.1044 1.51188 13.0113 1.57429 12.9329 1.65295L6.18289 8.40295C6.02521 8.56155 5.93695 8.77626 5.9375 8.9999V11.2499C5.9375 11.4737 6.02639 11.6883 6.18463 11.8465C6.34286 12.0048 6.55747 12.0937 6.78125 12.0937H9.03125C9.14209 12.0937 9.25185 12.072 9.35428 12.0296C9.45671 11.9873 9.54979 11.9252 9.6282 11.8469L16.3782 5.09686C16.4567 5.01849 16.5189 4.92544 16.5613 4.82301C16.6038 4.72058 16.6257 4.61079 16.6257 4.4999C16.6257 4.38902 16.6038 4.27923 16.5613 4.1768C16.5189 4.07437 16.4567 3.98131 16.3782 3.90295ZM13.5312 3.44522L14.5859 4.4999L13.8125 5.27334L12.7578 4.21865L13.5312 3.44522ZM8.67969 10.4062H7.625V9.35147L11.5625 5.41397L12.6172 6.46865L8.67969 10.4062ZM16.0625 9.32123V14.6249C16.0625 14.9979 15.9143 15.3555 15.6506 15.6193C15.3869 15.883 15.0292 16.0312 14.6562 16.0312H3.40625C3.03329 16.0312 2.6756 15.883 2.41188 15.6193C2.14816 15.3555 2 14.9979 2 14.6249V3.3749C2 3.00194 2.14816 2.64426 2.41188 2.38053C2.6756 2.11681 3.03329 1.96865 3.40625 1.96865H8.70992C8.9337 1.96865 9.14831 2.05755 9.30654 2.21578C9.46478 2.37402 9.55367 2.58863 9.55367 2.8124C9.55367 3.03618 9.46478 3.25079 9.30654 3.40903C9.14831 3.56726 8.9337 3.65615 8.70992 3.65615H3.6875V14.3437H14.375V9.32123C14.375 9.09746 14.4639 8.88284 14.6221 8.72461C14.7804 8.56638 14.995 8.47748 15.2188 8.47748C15.4425 8.47748 15.6571 8.56638 15.8154 8.72461C15.9736 8.88284 16.0625 9.09746 16.0625 9.32123Z"
          fill="#1B4DFF"
        />
      </g>
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
  const articleAnalyticsViewedRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    trackArticleViewed,
    trackArticleLiked,
    trackArticleEditButtonClicked,
    trackArticleBackClicked,
    trackScheduleMeetingClicked,
  } = useFounderGuidesAnalytics();
  const [subheaderSlot, setSubheaderSlot] = useState<HTMLElement | null>(null);

  const article = articles.find((a) => a.slugURL === slug);

  const { userInfo } = getCookiesFromClient();
  const isAuthenticated = !!userInfo;
  const { canCreate } = useFounderGuidesCreateAccess();

  const authorMemberUid = article?.authorMember?.uid;
  const { data: memberData } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, authorMemberUid],
    queryFn: () => getMemberInfo(authorMemberUid!),
    enabled: !!authorMemberUid,
  });

  useEffect(() => {
    setSubheaderSlot(document.getElementById('mobile-subheader-actions'));
  }, []);

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

  useEffect(() => {
    if (article && articleAnalyticsViewedRef.current !== article.uid) {
      articleAnalyticsViewedRef.current = article.uid;
      trackArticleViewed({ articleUid: article.uid, slug: article.slugURL });
    }
  }, [article, trackArticleViewed]);

  // Open all links inside the rendered markdown content in a new tab
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]');
      if (!link) return;
      e.preventDefault();
      window.open(link.getAttribute('href')!, '_blank', 'noopener,noreferrer');
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, []);

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

  const canEdit = canEditArticle(article, userInfo, canCreate);
  const isTeamAuthor = !!article.authorTeam && !article.authorMember;
  const authorName = article.authorMember?.name || article.authorTeam?.name || 'Unknown';

  // Derive role & team from fetched member details
  const memberInfo = memberData && !('isError' in memberData) ? memberData.data : null;
  const mainTeamRole = memberInfo?.teamMemberRoles?.find((tmr: any) => tmr.mainTeam);
  const authorRoleAndTeam =
    mainTeamRole ? `${mainTeamRole.role} @${mainTeamRole.teamTitle}`.trim() : null;
  const authorImage = isTeamAuthor
    ? (article.authorTeam?.logo?.url ?? null)
    : resolveMemberImageUrl(article.authorMember?.image);
  const authorLogo = authorImage ?? (article.authorTeam?.logo?.url || null);
  const initials = authorName.slice(0, 2).toUpperCase();
  const officeHoursUrl = article.authorMember?.officeHours || article.authorTeam?.officeHours || null;
  const scheduleMeetingLinkType: 'member' | 'team' | null = article.authorMember?.officeHours
    ? 'member'
    : article.authorTeam?.officeHours
      ? 'team'
      : null;

  const editLink = canEdit ? `/founder-guides/${article.slugURL}/edit` : null;

  const handleLikeClick = () => {
    trackArticleLiked({ articleUid: article.uid, liked: !article.isLiked });
    likeMutation.mutate({ uid: article.uid, isLiked: article.isLiked });
  };

  return (
    <>
      {/* Portal: render edit button in mobile subheader */}
      {editLink &&
        subheaderSlot &&
        createPortal(
          <Link
            href={editLink}
            className={s.mobileEditButton}
            onClick={() => trackArticleEditButtonClicked({ articleUid: article.uid, slug: article.slugURL })}
          >
            <NotePencilIcon />
            <span>Edit Guide</span>
          </Link>,
          subheaderSlot,
        )}
      <div className={s.root}>
        <BackButton to="/founder-guides" className={s.backButton} onNavigate={trackArticleBackClicked} />
        <div className={s.card}>
          <header className={s.header}>
            {/*<span className={s.categoryBadge}>{article.category}</span>*/}

            <div className={s.titleRow}>
              <h1 className={s.title}>{article.title}</h1>
              {canEdit && (
                <Link
                  href={`/founder-guides/${article.slugURL}/edit`}
                  className={s.editButton}
                  onClick={() => trackArticleEditButtonClicked({ articleUid: article.uid, slug: article.slugURL })}
                >
                  <NotePencilIcon />
                  <span>Edit Guide</span>
                </Link>
              )}
            </div>

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
                {authorRoleAndTeam && (
                  <>
                    <DotSep />
                    <span className={s.authorRole}>{authorRoleAndTeam}</span>
                  </>
                )}
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

              {/*{isAuthenticated && (*/}
              {/*  <button*/}
              {/*    className={`${s.likeGuideButton} ${article.isLiked ? s.likeGuideButtonLiked : ''}`}*/}
              {/*    onClick={handleLikeClick}*/}
              {/*    disabled={likeMutation.isPending}*/}
              {/*    aria-pressed={article.isLiked}*/}
              {/*    aria-label={article.isLiked ? 'Unlike this guide' : 'Like this guide'}*/}
              {/*  >*/}
              {/*    <ThumbsUpBoldIcon filled={article.isLiked} />*/}
              {/*    {article.isLiked ? 'Liked' : 'Like this Guide'}*/}
              {/*  </button>*/}
              {/*)}*/}
            </div>
          </header>

          <hr className={s.divider} />

          <div className={s.content} ref={contentRef}>
            <MdPreview
              modelValue={article.content}
              language="en-US"
              mdHeadingId={slugifyHeading}
              noKatex
            />
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

          {isAuthenticated && (
            <>
              <hr className={s.divider} />
              <div className={s.helpfulSection}>
                <h2 className={s.helpfulTitle}>Find this guide helpful?</h2>
                <button
                  className={`${s.likeGuideButton} ${article.isLiked ? s.likeGuideButtonLiked : ''}`}
                  onClick={handleLikeClick}
                  disabled={likeMutation.isPending}
                  aria-pressed={article.isLiked}
                  aria-label={article.isLiked ? 'Unlike this guide' : 'Like this guide'}
                >
                  <ThumbsUpBoldIcon filled={article.isLiked} />
                  {article.isLiked ? 'Liked' : 'Like this Guide'}
                </button>
              </div>
            </>
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
                <a
                  href={officeHoursUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.ohButton}
                  onClick={() => {
                    if (scheduleMeetingLinkType === 'member' && article.authorMember) {
                      trackScheduleMeetingClicked({
                        articleUid: article.uid,
                        slug: article.slugURL,
                        meetingLinkType: 'member',
                        memberUid: article.authorMember.uid,
                        memberName: article.authorMember.name,
                      });
                    } else if (scheduleMeetingLinkType === 'team' && article.authorTeam) {
                      trackScheduleMeetingClicked({
                        articleUid: article.uid,
                        slug: article.slugURL,
                        meetingLinkType: 'team',
                        teamUid: article.authorTeam.uid,
                        teamName: article.authorTeam.name,
                      });
                    }
                  }}
                >
                  <CalendarBlankIcon />
                  Schedule Meeting
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
