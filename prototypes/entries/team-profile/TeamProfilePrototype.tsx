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
import { TeamContributionsView, type ContributionsVariant } from './TeamContributionsView';
import { TeamProjectsView } from './TeamProjectsView';
import { NewsCardView } from './NewsCardView';
import { NewsFullPageView } from './NewsFullPageView';
import { TeamFollowBlock } from './TeamFollowBlock';
import { TeamAdminActions } from './TeamAdminActions';
// Contributions (Events) block + its mocks live in the demoday-tag-placements
// entry; reuse the recommended "feature" Demo Day treatment here in full context.
import { EventsContributionsView } from '../demoday-tag-placements/EventsContributionsView';
import { MOCK_EVENT_GROUPS, MOCK_DEMO_DAY_CONTRIB } from '../demoday-tag-placements/mocks';
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
  // Demo-only: compare the two role-tag treatments.
  const [contribVariant, setContribVariant] = useState<ContributionsVariant>('vibrant');
  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (followToastTimer.current) clearTimeout(followToastTimer.current);
  }, []);

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

  const displayNews = [...MOCK_NEWS].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );

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

      <div className={local.layout}>
        <div className={`${shell.teamDetail} ${local.mainCol}`}>
        <BackButton to="/prototypes/teams" />
        <div className={shell.teamDetail__container}>
        {/* Details — the follow block sits before the About section. */}
        <div className={shell.teamDetail__Container__details}>
          <TeamDetailsView
            team={team}
            demoDayParticipation={MOCK_TEAM_DEMO_DAY}
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

        {/* Focus areas — import-safe production view. */}
        <DetailsSection>
          <TeamFocusAreasView team={team} userInfo={null} focusAreas={focusAreas} toggleIsEditMode={() => {}} />
        </DetailsSection>

          {/* Contributions — event-primary tiles; Demo Day featured when present.
              Demo-only switch between the two role-tag treatments. */}
          <div className={local.contribLayoutBar}>
            <span className={local.demoLabel}>Role tags</span>
            <div className={local.demoSwitch}>
              {([
                ['vibrant', 'Vibrant'],
                ['muted', 'Muted'],
              ] as [ContributionsVariant, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`${local.demoBtn} ${contribVariant === key ? local.demoBtnActive : ''}`}
                  onClick={() => setContribVariant(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TeamContributionsView
            contributions={MOCK_CONTRIBUTIONS}
            demoDay={MOCK_TEAM_DEMO_DAY}
            variant={contribVariant}
          />

          {/* Projects */}
          <TeamProjectsView team={team} projects={MOCK_PROJECTS} />

          {/* Contributions (Events) — Demo Day reads as a normal event: a
              "Participant" role row + a plain chip, same weight as Host/Sponsor. */}
          <EventsContributionsView groups={MOCK_EVENT_GROUPS} demoDay={MOCK_DEMO_DAY_CONTRIB} variant="native" />
        </div>
      </div>

      {/* News rail — team-related news (mocked), reusing the homepage NewsCard. */}
      <aside className={local.rail}>
        {/* Reserve the Back button's height so the news panel lines up with the
            team card top (the main column has a Back button above it). */}
        <div className={local.railBackSpacer} aria-hidden="true">
          <BackButton to="/prototypes/teams" />
        </div>
        <div className={local.newsPanel}>
          <DetailsSectionHeader title={`${team.name} News (${displayNews.length})`} />
          <div className={local.newsList}>
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
    </div>
  );
}

