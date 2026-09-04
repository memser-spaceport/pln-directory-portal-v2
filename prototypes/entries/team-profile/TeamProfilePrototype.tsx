'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import type { ITeam } from '@/types/teams.types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

import { BackButton } from '@/components/ui/BackButton';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { TagsList } from '@/components/common/profile/TagsList';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

// Import-safe production view + hook (no store / service / analytics).
import { TeamFocusAreasView } from '@/components/page/team-details/TeamFocusAreas/components/TeamFocusAreasView';
import { useGetFocusAreasToDisplay } from '@/components/page/team-details/TeamFocusAreas/hooks/useGetFocusAreasToDisplay';

// Reuse the production team-detail page shell styling.
import shell from '@/app/teams/[id]/page.module.css';

import { TeamDetailsView } from './TeamDetailsView';
import { TeamInvestorView } from './TeamInvestorView';
import { TeamContactView } from './TeamContactView';
import { TeamMembersView } from './TeamMembersView';
import { TeamContributionsView } from './TeamContributionsView';
import { TeamProjectsView } from './TeamProjectsView';
import { TeamOpenRolesView } from './TeamOpenRolesView';
import { NewsCardView } from './NewsCardView';
import { NewsFullPageView } from './NewsFullPageView';
import { TeamFollowBlock } from './TeamFollowBlock';
import { TeamAdminActions } from './TeamAdminActions';
import { PostNewsModal, type PostNewsSubmission } from './PostNewsModal';
import { NewsEmptyCard } from './NewsEmptyCard';
import { PostNewsButton } from './PostNewsButton';
import { deriveDomain } from './newsUrl';
import { FollowPill } from '../follow-shared/FollowPill';
import { FollowToast } from '../follow-shared/FollowToast';
// The archive itself — the same component the teams grid's news chip opens, so
// one team's news is one box wherever you reach it from.
import { TeamNewsModal } from '../news-shared/TeamNewsModal';
// The feed's story detail modal + its event palette, so a story reads the same
// wherever it's opened from.
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_LABEL, EVENT_TYPE_HEX } from '../newsfeed-v0/eventMeta';
import type { FeedComment } from '../newsfeed-v0/mocks';
import local from './TeamProfile.module.scss';
import {
  MOCK_TEAM,
  MOCK_MEMBERS,
  MOCK_FOCUS_AREAS,
  MOCK_TEAM_FOCUS_AREAS,
  MOCK_PROJECTS,
  MOCK_CONTRIBUTIONS,
  MOCK_NEWS,
  NEWS_LIKES,
  NEWS_VIEWS,
  NEWS_COMMENT_THREADS,
  MOCK_FOLLOWERS,
  TEAM_FOLLOWER_COUNT,
  MOCK_TEAM_DEMO_DAY,
  MOCK_TEAM_ROLES,
  MOCK_TEAM_FACTS,
  type TeamStatus,
} from './mocks';

const team = MOCK_TEAM as unknown as ITeam;

const NEWS_PREVIEW_COUNT = 3;

export default function TeamProfilePrototype() {
  // Several reused leaf components are base-ui / client-only (Tooltip, Tag
  // popovers). Gate render on mount so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  /**
   * The team's mark, resolved exactly as the page header resolves it (see
   * TeamDetailsView). Every surface that names the team wears it — the archive's
   * header, and the story headers reached from the rail, the archive and the
   * mobile page — because a news item's own `teamLogoUrl` is only set when the
   * feed happened to resolve one, and a header that falls back to a letter tile
   * reads as a different team's page than the one behind it.
   */
  const defaultAvatar = useDefaultAvatar(team?.name ?? '');
  const teamLogo = team?.logo ?? defaultAvatar ?? '/icons/team-default-profile.svg';
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsFocusUid, setNewsFocusUid] = useState<string | null>(null);
  const [newsQuery, setNewsQuery] = useState('');
  const [following, setFollowing] = useState(false);
  const [followToast, setFollowToast] = useState(false);
  const followToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Demo-only: public vs team view. Both put the follow cluster in the header
  // card's top-right corner: public gets the Follow pill, team gets the
  // follower avatar stack + count (opens the full-list modal).
  const [view, setView] = useState<'public' | 'team'>('team');
  // Demo-only: with one mock team, flipping status is the only way to see the
  // inactive treatment at all. It lives in the demo bar with the view switch,
  // outside the page card — a prototype control, not something on the profile.
  const [status, setStatus] = useState<TeamStatus>('active');
  // Demo-only, same reason as the status switch: one mock team, so the only
  // way to see the rail with nothing in it is to empty it.
  const [newsSeed, setNewsSeed] = useState<'some' | 'none'>('some');
  useEffect(() => setMounted(true), []);

  /**
   * WHO CAN POST. Production gates the team's own surfaces on
   * `isCurrentUserTeamMember || isAdmin` (TeamDetails.tsx — the followers block,
   * the asks) and this prototype's "Team" view is that pair. Admins and members
   * post the same way, so the flow has one door, not two ranks of it. A team
   * that has wound down posts nothing: news is something a team is doing, and
   * an inactive team is, by definition, not.
   */
  const canPost = view === 'team' && status === 'active';

  /**
   * The team's news, in state because the team can now add to it. Seeded from
   * the mocks; a posted item is prepended, so the rail, the archive, the mobile
   * page and the detail modal all read the same list.
   */
  const [news, setNews] = useState<ITeamNewsItem[]>(MOCK_NEWS);
  useEffect(() => setNews(newsSeed === 'some' ? MOCK_NEWS : []), [newsSeed]);
  /** Items the team wrote here, as opposed to enriched from coverage. */
  const [authoredUids, setAuthoredUids] = useState<Set<string>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  /** The story just posted — flashed in the rail so the press has a visible outcome. */
  const [postedUid, setPostedUid] = useState<string | null>(null);
  const railListRef = useRef<HTMLDivElement>(null);

  const publishNews = ({ title, body, url, summary }: PostNewsSubmission) => {
    const now = new Date().toISOString();
    const uid = `news-local-${Date.now()}`;
    const item: ITeamNewsItem = {
      uid,
      teamUid: team.id ?? 'protocol-labs',
      teamName: team.name ?? 'This team',
      // Null like every sibling row: the archive's team row falls back to the
      // same monogram for all of them, and one row with a different mark would
      // read as a different team.
      teamLogoUrl: null,
      // The card's type dot. Nothing in the form asks for one — a team's own
      // post is an announcement by construction; the finer types (funding,
      // launch, milestone) are the enrichment pipeline's classification of
      // coverage, not something an author picks.
      eventType: 'ANNOUNCEMENT',
      eventDate: now,
      title,
      summary,
      contentHtml: body || undefined,
      sourceUrl: url,
      sourceDomain: deriveDomain(url),
      tags: [],
      focusAreas: [],
      subFocusAreas: [],
      createdAt: now,
      discussion: { count: 0, latestTopicUrl: null },
    };
    setNews((prev) => [item, ...prev]);
    setAuthoredUids((prev) => new Set(prev).add(uid));
    setPostedUid(uid);
  };

  // The receipt for a post is the post itself, at the top of the rail: scroll
  // it into view and flash it. A background flash rather than the archive's
  // ring: the rail's rows are flat and its list clips to a scroll region, so a
  // ring drawn around a row only ever shows its bottom edge — a thick blue
  // divider, not a highlight.
  useEffect(() => {
    if (!postedUid) return;
    const el = railListRef.current?.querySelector<HTMLElement>(`[data-news-uid="${postedUid}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add(local.newsPosted);
    const timer = setTimeout(() => {
      el.classList.remove(local.newsPosted);
      setPostedUid(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [postedUid]);
  useEffect(
    () => () => {
      if (followToastTimer.current) clearTimeout(followToastTimer.current);
    },
    [],
  );

  const handleFollowToggle = () => {
    setFollowing((prev) => {
      const willFollow = !prev;
      if (willFollow) {
        setFollowToast(true);
        if (followToastTimer.current) clearTimeout(followToastTimer.current);
        followToastTimer.current = setTimeout(() => setFollowToast(false), 4000);
      }
      return willFollow;
    });
  };

  // Likes: mock base count + your own toggled like, shared by the rail, the
  // modal, and the mobile full page so the same story stays in sync. Views and
  // comments are read-only here — the thread is opened, not written, from a
  // profile rail.
  const [likedNews, setLikedNews] = useState<Set<string>>(new Set());
  const toggleNewsLike = (uid: string) =>
    setLikedNews((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  const likesFor = (uid: string) => (NEWS_LIKES[uid] ?? 0) + (likedNews.has(uid) ? 1 : 0);
  const viewsFor = (uid: string) => NEWS_VIEWS[uid] ?? 0;

  /**
   * Comment threads live in state because the modal can add to them. Counts are
   * read off the same threads, so a card can never advertise a number the modal
   * doesn't have.
   */
  const [threadsByUid, setThreadsByUid] = useState<Record<string, FeedComment[]>>(() => ({
    ...NEWS_COMMENT_THREADS,
  }));
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const threadFor = (uid: string) => threadsByUid[uid] ?? [];
  const commentsFor = (uid: string) => threadFor(uid).length;

  const addComment = (uid: string, text: string, parentUid?: string) =>
    setThreadsByUid((prev) => ({
      ...prev,
      [uid]: [
        ...(prev[uid] ?? []),
        {
          uid: `c-${uid}-${(prev[uid]?.length ?? 0) + 1}-local`,
          author: 'You',
          role: 'Member',
          text,
          createdAt: new Date().toISOString(),
          parentUid,
          likes: 0,
        },
      ],
    }));

  const toggleCommentLike = (commentUid: string) =>
    setLikedComments((prev) => {
      const next = new Set(prev);
      next.has(commentUid) ? next.delete(commentUid) : next.add(commentUid);
      return next;
    });

  /**
   * The story detail modal — the feed's own `FeedDetailModal`, so a story opened
   * from a profile is the same object as one opened from the feed (same body,
   * sources, AI disclosure, thread and footer metrics) rather than a
   * profile-flavoured retelling of it.
   */
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  /** One payload shape, so a story reads the same from the rail and the archive. */
  const toDetail = (item: ITeamNewsItem): FeedDetail => ({
    id: item.uid,
    kind: 'news',
    title: item.title,
    name: item.teamName,
    logoUrl: item.teamLogoUrl ?? teamLogo,
    kicker: EVENT_TYPE_LABEL[item.eventType],
    kickerColor: EVENT_TYPE_HEX[item.eventType],
    summary: item.summary,
    time: item.eventDate,
    views: viewsFor(item.uid),
    readUrl: item.sourceUrl ?? undefined,
    authored: authoredUids.has(item.uid),
    bodyHtml: authoredUids.has(item.uid) ? item.contentHtml : undefined,
  });
  const openDetail = (item: ITeamNewsItem) => setDetail(toDetail(item));

  /**
   * The story the MOBILE archive has drilled into, kept apart from `detail`
   * above.
   *
   * The rail opens a story as an overlay over the profile; the archive is
   * *already* covering the screen, so it swaps its own body instead — a modal
   * over a modal would give the reader two close buttons and an Escape key that
   * means two different things. Two states because the two surfaces answer a
   * click differently, not because the story differs.
   *
   * Desktop no longer needs this: `TeamNewsModal` owns its own drill state (and
   * its own scroll-back), the same way it does on the teams grid.
   */
  const [archiveStory, setArchiveStory] = useState<FeedDetail | null>(null);

  const displayNews = [...news].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  /**
   * The rail exists when there is news to read — or when the reader could
   * write some. Production hides the whole panel for a team with no news
   * (`showNewsRail = hasTeamNewsItems`); that stays true for visitors, who
   * would only be shown an absence. A member of the team gets the panel with
   * an invitation in it instead.
   */
  const showRail = displayNews.length > 0 || canPost;

  // Rail previews a few; "View all" opens the full feed in a modal.
  const previewNews = displayNews.slice(0, NEWS_PREVIEW_COUNT);
  const hasMore = displayNews.length > NEWS_PREVIEW_COUNT;

  const q = newsQuery.trim().toLowerCase();
  const filteredNews = q
    ? displayNews.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.eventType.toLowerCase().includes(q) ||
          (item.sourceDomain ?? '').toLowerCase().includes(q),
      )
    : displayNews;

  // "Show more" on a rail card opens the full feed focused on that item; plain
  // "View all" opens it at the top (uid = null).
  const openNewsFeed = (uid: string | null = null) => {
    setNewsQuery('');
    setNewsFocusUid(uid);
    setNewsModalOpen(true);
  };

  const closeNewsModal = () => {
    setNewsModalOpen(false);
    setNewsQuery('');
    setNewsFocusUid(null);
    // Reopening lands on the list, not on whatever story was last read.
    setArchiveStory(null);
  };

  /** Drill into a story without leaving the archive. */
  const openArchiveStory = (item: ITeamNewsItem) => setArchiveStory(toDetail(item));

  /**
   * Back to the list, focused on the story just left — the same scroll-and-flash
   * the rail's "Show more" uses, so the reader lands where they were rather than
   * at the top of a list they'd scrolled halfway down.
   */
  const backToArchiveList = () => {
    setNewsFocusUid(archiveStory?.id ?? null);
    setArchiveStory(null);
  };

  const focusAreas = useGetFocusAreasToDisplay(MOCK_FOCUS_AREAS, MOCK_TEAM_FOCUS_AREAS);

  if (!mounted) {
    return <div className={shell.teamDetail} />;
  }

  const followCount = TEAM_FOLLOWER_COUNT;

  return (
    <div className={local.page}>
      <div className={local.demoBar}>
        <div className={local.demoGroup}>
          <span className={local.demoLabel}>View</span>
          <div className={local.demoSwitch}>
            <button
              type="button"
              className={`${local.demoBtn} ${view === 'team' ? local.demoBtnActive : ''}`}
              onClick={() => setView('team')}
            >
              Team
            </button>
            <button
              type="button"
              className={`${local.demoBtn} ${view === 'public' ? local.demoBtnActive : ''}`}
              onClick={() => setView('public')}
            >
              Public
            </button>
          </div>
        </div>

        <div className={local.demoGroup}>
          <span className={local.demoLabel}>Status</span>
          <div className={local.demoSwitch}>
            <button
              type="button"
              className={`${local.demoBtn} ${status === 'active' ? local.demoBtnActive : ''}`}
              onClick={() => setStatus('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`${local.demoBtn} ${status === 'inactive' ? local.demoBtnActive : ''}`}
              onClick={() => setStatus('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className={local.demoGroup}>
          <span className={local.demoLabel}>News</span>
          <div className={local.demoSwitch}>
            <button
              type="button"
              className={`${local.demoBtn} ${newsSeed === 'some' ? local.demoBtnActive : ''}`}
              onClick={() => setNewsSeed('some')}
            >
              Has news
            </button>
            <button
              type="button"
              className={`${local.demoBtn} ${newsSeed === 'none' ? local.demoBtnActive : ''}`}
              onClick={() => setNewsSeed('none')}
            >
              None yet
            </button>
          </div>
        </div>
      </div>

      <div className={local.layout}>
        <div className={`${shell.teamDetail} ${local.mainCol}`}>
          <BackButton to="/prototypes/teams" />
          <div className={shell.teamDetail__container}>
            {/* Details — the follow block sits before the About section. */}
            <div className={shell.teamDetail__Container__details}>
              {/* No `demoDayParticipation`: the Demo Day emblem beside the team name
              is gone. The participation itself still reads on the page — as a
              tile in Contributions, where it sits among the team's other events
              instead of qualifying the team's name. The placement variants stay
              on TeamDetailsView for the demoday-tag-placements prototype, which
              exists to compare them. */}
              <TeamDetailsView
                team={team}
                facts={MOCK_TEAM_FACTS}
                status={status}
                headerAction={
                  view === 'public' ? (
                    <div className={`${local.followHeader} ${local.followClusterMobile}`}>
                      <FollowPill following={following} onToggle={handleFollowToggle} name={team.name ?? 'this team'} />
                      {/* Reserve the caption's height once following so nothing below jumps. */}
                      <p className={`${local.followCaption} ${following ? local.followCaptionHidden : ''}`}>
                        Get updates &amp; announcements
                      </p>
                    </div>
                  ) : (
                    <div className={local.teamHeaderCluster}>
                      {/* Admin actions row (Edit + Delete): pinned top-right, level with the
                      team name, on every viewport — on mobile this escapes the
                      full-width wrap below via absolute positioning so it doesn't
                      end up stranded under the logo/tags. TeamFollowBlock (the
                      follower stack) keeps wrapping below on mobile as before. */}
                      <div className={local.adminActionsCorner}>
                        <TeamAdminActions teamName={team.name ?? 'this team'} />
                      </div>
                      <TeamFollowBlock count={followCount} followers={MOCK_FOLLOWERS} />
                    </div>
                  )
                }
              />
            </div>

            {/* Fund details (team.isFund) */}
            {team?.isFund && <TeamInvestorView team={team} />}

            {/* Contact */}
            <div className={shell.teamDetail__container__contact}>
              <TeamContactView team={team} />
            </div>

            {/* Membership source + community affiliations — import-safe production view. */}
            <DetailsSection>
              <DetailsSectionHeader title="Membership Source" />
              <DetailsSectionGreyContentContainer>
                {team?.membershipSources?.length ? (
                  <TagsList tags={team.membershipSources} tagsToShow={5} />
                ) : (
                  <NoDataBlock>No membership source added.</NoDataBlock>
                )}
              </DetailsSectionGreyContentContainer>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="Community Affiliations" />
              <DetailsSectionGreyContentContainer>
                {team?.communityAffiliations?.length ? (
                  <TagsList tags={team.communityAffiliations} tagsToShow={5} />
                ) : (
                  <NoDataBlock>No community affiliations.</NoDataBlock>
                )}
              </DetailsSectionGreyContentContainer>
            </DetailsSection>

            {/* Members */}
            <div className={shell.teamDetail__container__member}>
              <TeamMembersView team={team} members={MOCK_MEMBERS} />
            </div>

            {/* Open roles — directly under Members because they're the same axis in
            two tenses: who's here, and who the team is looking for. Not in the
            news rail (that's a cross-surface stream, and 340px can't hold a role
            row); not near the top, because roles are perishable and most teams
            have none. Renders nothing when there are none. */}
            <TeamOpenRolesView group={MOCK_TEAM_ROLES} />

            {/* Focus areas — import-safe production view. */}
            <DetailsSection>
              <TeamFocusAreasView team={team} userInfo={null} focusAreas={focusAreas} toggleIsEditMode={() => {}} />
            </DetailsSection>

            {/* Contributions — event-primary tiles; Demo Day featured when present.
              Muted role tags, settled: the vibrant/muted switch was scaffolding
              for choosing between them, and it dies with the choice. */}
            <TeamContributionsView contributions={MOCK_CONTRIBUTIONS} demoDay={MOCK_TEAM_DEMO_DAY} variant="muted" />

            {/* Projects */}
            <TeamProjectsView team={team} projects={MOCK_PROJECTS} />
          </div>
        </div>

        {/* News rail — team-related news (mocked), reusing the homepage NewsCard. */}
        {showRail && (
          <aside className={local.rail}>
            {/* Reserve the Back button's height so the news panel lines up with the
            team card top (the main column has a Back button above it). */}
            <div className={local.railBackSpacer} aria-hidden="true">
              <BackButton to="/prototypes/teams" />
            </div>
            <div className={local.newsPanel}>
              {/* No "(0)" over the empty card — the card already says there is nothing. */}
              <DetailsSectionHeader
                title={displayNews.length > 0 ? `${team.name} News (${displayNews.length})` : `${team.name} News`}
              >
                {/* The section's own action, in the corner every profile section
                    keeps for one — only for someone who can post, and only once
                    there is news: with none, the empty card below is the one
                    door, and a second one here would open into the same room.

                    A small filled primary button with a one-time callout (see
                    PostNewsButton). The placements it went through, for the
                    record: the sections' link-style HeaderActionBtn here (blue
                    14px text beside this panel's blue 14px title — "almost
                    impossible to notice"); a bordered button here (read, but
                    crowded); a full-width bordered row under the header; an
                    input-shaped compose prompt in that row (the feed idiom).
                    The corner won with a filled button and an announcement:
                    a new feature is found by being announced, not by taking
                    more of the list. */}
                {canPost && displayNews.length > 0 && (
                  <PostNewsButton teamName={team.name ?? 'this team'} onPost={() => setComposeOpen(true)} />
                )}
              </DetailsSectionHeader>
              {canPost && displayNews.length === 0 && <NewsEmptyCard onPost={() => setComposeOpen(true)} />}
              <div className={local.newsList} ref={railListRef}>
                {previewNews.map((item) => (
                  <NewsCardView
                    key={item.uid}
                    item={item}
                    flat
                    hideTeam
                    views={viewsFor(item.uid)}
                    likes={likesFor(item.uid)}
                    liked={likedNews.has(item.uid)}
                    comments={commentsFor(item.uid)}
                    onToggleLike={() => toggleNewsLike(item.uid)}
                    // Tap, "Show more" and the comment count are three ways of
                    // asking for the same thing: this story, in full.
                    onOpenComments={() => openDetail(item)}
                    onShowMore={() => openDetail(item)}
                  />
                ))}
              </div>
              {/* The rail's two exits, paired on one row. They're deliberately not
              interchangeable: "View all news" stays inside this team (the modal
              is its own archive), while "All network updates" leaves for the home feed
              (which carries forum/events/Demo Day too — not just team news; "all"
              is the word marking that widening, and the ↗ carries "elsewhere")
              — hence the ↗ and the quieter neutral text against the blue. When
              there's no archive to open, the remaining button takes the row. */}
              <div className={local.newsFooter}>
                {hasMore && (
                  <button type="button" className={local.viewAll} onClick={() => openNewsFeed()}>
                    View all news ({displayNews.length})
                  </button>
                )}
                <Link href="/prototypes/newsfeed" prefetch={false} className={local.viewFeed}>
                  All network updates
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        )}

        {/* The team's full archive. Mobile gets a full-screen page
          (Notifications-style), desktop a modal with its own scroll.
          Either way it DRILLS rather than stacks: click a story and the same box
          swaps to it with Back on the left, Close still on the right. A second
          overlay on top would mean two close buttons and an ambiguous Escape —
          the pattern Mixpanel's Event History and Threads' post activity both
          avoid the same way. */}
        {newsModalOpen && isMobile ? (
          <NewsFullPageView
            title={`${team.name} News`}
            count={displayNews.length}
            items={filteredNews}
            focusUid={newsFocusUid}
            query={newsQuery}
            onQueryChange={setNewsQuery}
            onClose={closeNewsModal}
            viewsFor={viewsFor}
            likesFor={likesFor}
            commentsFor={commentsFor}
            likedNews={likedNews}
            onToggleLike={toggleNewsLike}
            onOpenStory={openArchiveStory}
            story={archiveStory}
            onBack={backToArchiveList}
            storyComments={archiveStory ? threadFor(archiveStory.id) : []}
            onAddStoryComment={(text, parentUid) => archiveStory && addComment(archiveStory.id, text, parentUid)}
            isCommentLiked={(uid) => likedComments.has(uid)}
            onToggleCommentLike={toggleCommentLike}
          />
        ) : (
          newsModalOpen && (
            // The same box the teams grid's "N new posts" chip opens, and the job
            // board's. This used to be its own modal written out here, which put
            // two different-looking answers behind two doors onto one thing: the
            // team's news. The extras the archive needs — a search field over a
            // whole history, the like/comment state it shares with the rail —
            // ride in as props rather than as a second component.
            <TeamNewsModal
              teamName={team.name ?? 'This team'}
              teamLogo={teamLogo}
              items={filteredNews}
              count={displayNews.length}
              onClose={closeNewsModal}
              query={newsQuery}
              onQueryChange={setNewsQuery}
              viewsFor={viewsFor}
              likesFor={likesFor}
              commentsFor={commentsFor}
              isLiked={(uid) => likedNews.has(uid)}
              onToggleLike={toggleNewsLike}
              threadFor={threadFor}
              onAddComment={addComment}
              isCommentLiked={(uid) => likedComments.has(uid)}
              onToggleCommentLike={toggleCommentLike}
            />
          )
        )}
      </div>

      {/* One story, in full — the feed's own modal. Rendered outside the news
          panel so it overlays the page, not the rail. */}
      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likesFor(detail.id) : 0}
        liked={detail ? likedNews.has(detail.id) : false}
        onToggleLike={() => detail && toggleNewsLike(detail.id)}
        citationStyle="off"
        showComments
        comments={detail ? threadFor(detail.id) : []}
        onAddComment={(text, parentUid) => detail && addComment(detail.id, text, parentUid)}
        isCommentLiked={(commentUid) => likedComments.has(commentUid)}
        onToggleCommentLike={toggleCommentLike}
      />

      {followToast && (
        <FollowToast>
          You&apos;re following <strong>{team.name}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}

      {/* Compose. Mounted only for someone who can post — the modal owns a
          draft, and a draft for a person with nowhere to post it is a leak. */}
      {canPost && (
        <PostNewsModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          teamUid={team.id ?? 'protocol-labs'}
          teamName={team.name ?? 'This team'}
          existing={news}
          onPublish={publishNews}
        />
      )}
    </div>
  );
}
