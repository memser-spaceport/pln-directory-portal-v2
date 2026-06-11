'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import 'md-editor-rt/lib/preview.css';
import { useQuery } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { SCOPE_LABELS, PERMISSION_CODE_TO_SCOPE } from '@/services/articles/constants';

import { slugifyHeading } from '@/utils/markdown';
import { getMemberInfo } from '@/services/members.service';

import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useArticleView } from '@/services/articles/hooks/useArticleView';
import { useArticleLike } from '@/services/articles/hooks/useArticleLike';
import { useCurrentUserStore } from '@/services/auth/store';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
import { useFounderGuidesScopes } from '@/services/rbac/hooks/useFounderGuidesScopes';
import { useFounderGuidesCreateAccess } from '@/services/rbac/hooks/useFounderGuidesCreateAccess';

import { BackButton } from '@/components/ui/BackButton/BackButton';
import { GuideComments } from '@/components/page/founder-guides/GuideComments/GuideComments';

import { formatDate } from './utils/formatDate';
import { formatCount } from './utils/formatCount';
import { resolveMemberImageUrl } from './utils/resolveMemberImageUrl';
import { canEditArticle, formatAuthorMemberMainTeamLabel } from './helpers';

import {
  DotSep,
  EyeIcon,
  TimerIcon,
  DotSepLarge,
  ThumbsUpIcon,
  CalendarIcon,
  NotePencilIcon,
  ThumbsUpBoldIcon,
  CalendarBlankIcon,
} from './components/Icons';

import s from './ArticleContent.module.scss';

const MdPreview = dynamic(() => import('md-editor-rt').then((mod) => mod.MdPreview), { ssr: false });

interface ArticleContentProps {
  slug: string;
}

export default function ArticleContent({ slug }: ArticleContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasCommentId = !!searchParams.get('commentId');
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

  const { currentUser: userInfo } = useCurrentUserStore();
  const isAuthenticated = !!userInfo;
  const { canCreate } = useFounderGuidesCreateAccess();
  const { scopes } = useFounderGuidesScopes();

  const authorMemberUid = article?.authorMember?.uid;

  const { data: memberData } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, authorMemberUid],
    queryFn: () => getMemberInfo(authorMemberUid!),
    enabled: !!authorMemberUid,
  });

  useEffect(() => {
    if (!article || hasCommentId) {
      return;
    }

    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [article?.uid]);

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
  const defaultAvatar = getDefaultAvatar(authorName);
  const authorRoleAndTeam = formatAuthorMemberMainTeamLabel(article.authorMember);
  const authorImage = isTeamAuthor
    ? (article.authorTeam?.logo?.url ?? null)
    : resolveMemberImageUrl(article.authorMember?.image);
  const authorLogo = authorImage ?? (article.authorTeam?.logo?.url || null);
  const initials = authorName.slice(0, 2).toUpperCase();
  const authorMainTeamRoles = article.authorMember?.teamMemberRoles;
  const authorMainTeamRole = authorMainTeamRoles?.find((t) => t.mainTeam) ?? authorMainTeamRoles?.[0];
  const authorMemberMainTeamUid = authorMainTeamRole?.team?.uid ?? null;
  const backTo = encodeURIComponent(pathname);
  const authorProfileHref = !isTeamAuthor
    ? `/members/${article.authorMember?.uid}?backTo=${backTo}`
    : `/teams/${article.authorTeam?.uid}?backTo=${backTo}`;
  const authorTeamHref = authorMemberMainTeamUid ? `/teams/${authorMemberMainTeamUid}?backTo=${backTo}` : null;
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

  const handleScheduleMeetingClick = () => {
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
  };

  const ohCard = officeHoursUrl ? (
    <div className={s.ohSection}>
      <p className={s.ohTitle}>Book Office Hours with the author</p>
      <div className={s.ohBanner}>
        <div className={s.ohLeft}>
          <Link href={authorProfileHref} className={s.ohAvatarLink}>
            <div className={s.ohAvatarWrap}>
              {authorImage ? (
                <img src={authorImage} alt={authorName} className={s.ohAvatar} />
              ) : (
                <div className={s.ohInitial}>{initials}</div>
              )}
            </div>
          </Link>
          <div className={s.ohInfo}>
            <div className={s.ohNameRow}>
              <Link href={authorProfileHref} className={s.ohNameLink}>
                {authorName}
              </Link>
              {authorRoleAndTeam && authorTeamHref && (
                <>
                  <DotSepLarge />
                  <Link href={authorTeamHref} className={s.ohRoleLink}>
                    {authorRoleAndTeam}
                  </Link>
                </>
              )}
              {authorRoleAndTeam && !authorTeamHref && (
                <>
                  <DotSepLarge />
                  <span className={s.ohRole}>{authorRoleAndTeam}</span>
                </>
              )}
            </div>
            <span className={s.ohSubtitle}>
              {isTeamAuthor ? 'Schedule a meeting with this team.' : 'Available for 1:1 call — no introduction needed.'}
            </span>
          </div>
        </div>
        <a
          href={officeHoursUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={s.ohButton}
          onClick={handleScheduleMeetingClick}
        >
          <CalendarBlankIcon />
          Schedule Meeting
        </a>
      </div>
    </div>
  ) : null;

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
        <div className={s.topRow}>
          <BackButton to="/founder-guides" className={s.backButton} onNavigate={trackArticleBackClicked} />
        </div>
        <div className={s.card}>
          <header className={s.header}>
            <div className={s.topRowActions}>
              {scopes.length > 1 && article.requiredPermissionCode ? (
                <span className={s.categoryBadge}>
                  {SCOPE_LABELS[PERMISSION_CODE_TO_SCOPE[article.requiredPermissionCode]] ??
                    article.requiredPermissionCode}
                </span>
              ) : (
                <div />
              )}
              {canEdit ? (
                <Link
                  href={`/founder-guides/${article.slugURL}/edit`}
                  className={s.editButton}
                  onClick={() => trackArticleEditButtonClicked({ articleUid: article.uid, slug: article.slugURL })}
                >
                  <NotePencilIcon />
                  <span>Edit Guide</span>
                </Link>
              ) : null}
            </div>
            <div className={s.titleRow}>
              <h1 className={s.title}>{article.title}</h1>
            </div>

            {article.summary && <p className={s.summary}>{article.summary}</p>}

            {/* Details bar: author + stats */}
            <div className={s.details}>
              {ohCard ? null : (
                <>
                  <div className={s.authorDetails}>
                    <Link href={authorProfileHref} className={s.authorAvatarLink}>
                      {authorLogo ? (
                        <img src={authorLogo} alt={authorName} className={s.authorAvatar} />
                      ) : (
                        <img src={defaultAvatar} alt={authorName} className={s.authorAvatar} />
                      )}
                    </Link>
                    <Link href={authorProfileHref} className={s.authorNameLink}>
                      {authorName}
                    </Link>
                    {authorRoleAndTeam && authorTeamHref && (
                      <>
                        <DotSep />
                        <Link href={authorTeamHref} className={s.authorRoleLink}>
                          {authorRoleAndTeam}
                        </Link>
                      </>
                    )}
                    {authorRoleAndTeam && !authorTeamHref && (
                      <>
                        <DotSep />
                        <span className={s.authorRole}>{authorRoleAndTeam}</span>
                      </>
                    )}
                  </div>
                  <div className={s.detailsDivider} />
                </>
              )}
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

            {ohCard}
          </header>

          <hr className={s.divider} />

          <div className={s.content} ref={contentRef}>
            <MdPreview modelValue={article.content} language="en-US" mdHeadingId={slugifyHeading} noKatex />
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
                <p className={s.helpfulTitle}>Find this guide helpful?</p>
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

          {ohCard && <>{ohCard}</>}

          <GuideComments articleUid={article.uid} userInfo={userInfo ?? undefined} />
        </div>
      </div>
    </>
  );
}
