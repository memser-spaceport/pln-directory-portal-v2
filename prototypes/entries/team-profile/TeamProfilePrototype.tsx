'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';

import type { ITeam } from '@/types/teams.types';
import type { IJobRole } from '@/types/jobs.types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';

import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/common/Button';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { AiSearchView } from '../ai-search/AiSearchView';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';
import { buildTeamAiScope, type TeamScopeInput } from './aiSearchScope';
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
import { TeamApplicantsPage } from './TeamApplicantsPage';
import { getJobDate, seniorityDisplayLabel } from '@/utils/jobs.utils';
import { seedListingMeta, submitJobHref, type ListingMeta, type ListingStatus } from '../job-board/listings';
/* The board's apply flow, mounted here so a role read from its team's page is
   the same job to apply to as the same role read from the board. Before this
   the row's Apply was a plain link to the team's careers site, which made the
   team's own page the weaker of the two doors to its own roles — and produced
   applications the applicants count in this very section could never show.
   See the note on `TeamOpenRolesView`. */
import { JobApplyFlowDrawer, type ApplyFlowStepId } from '../job-board/JobApplyFlowDrawer';
import { FILLED_PROFILE, type MemberProfile } from '../job-board/viewerState';
/* One kept set across the surfaces: a role bookmarked here is in the board's
   Saved tab, not in a second list belonging to this page. */
import { useSavedItems } from '../save-shared/savedItems';
import { NewsCardView } from './NewsCardView';
import { NewsFullPageView } from './NewsFullPageView';
import { TeamFollowBlock } from './TeamFollowBlock';
import { TeamAdminActions } from './TeamAdminActions';
import { PostNewsModal, type PostNewsSubmission } from './PostNewsModal';
import { NewsPostMenu } from '../news-shared/NewsPostMenu';
import {
  TEAM_POST_VIEWER,
  applyTeamPostOverrides,
  canManageTeamPost,
  clearTeamPostOverrides,
  readTeamPostOverrides,
  writeTeamPostOverride,
  type NewsItemWithPost,
  type TeamPostRole,
} from '../news-shared/teamPosts';
import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';
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
  MOCK_APPLICANTS,
  MOCK_INTERESTED,
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
  /**
   * Demo-only: who is looking. Four seats, because the news controls draw
   * their line in a different place from the page's other owner features:
   *   admin  — a directory admin, not necessarily on the team
   *   lead   — a lead of this team
   *   member — on the team, not a lead
   *   public — everyone else
   * The first three are production's "team view" (`isCurrentUserTeamMember ||
   * isAdmin`): the follower stack in the header card's corner instead of the
   * Follow pill, the Asks, posting news. Jobs are narrower (lead or admin), and
   * editing someone else's news post narrower still — see `canManageTeamPost`.
   */
  const [view, setView] = useState<TeamPostRole>('lead');
  const isTeamView = view !== 'public';
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
  const canPost = isTeamView && status === 'active';

  /**
   * WHO CAN POST A JOB. Narrower than news in production — `isTeamLeaderOrAdmin`,
   * a lead of this team or a directory admin, not any member — so the Member
   * seat of the view switch gets the news door and not this one. Same second
   * half: a team that has wound down is not hiring.
   */
  const canSubmitJobs = (view === 'lead' || view === 'admin') && status === 'active';
  // Demo-only, same reason as the news seed: one mock team, so the only way to
  // see the owner's empty Open roles section is to take its roles away.
  const [rolesSeed, setRolesSeed] = useState<'some' | 'none'>('some');
  /**
   * The applicants page, open on a role — client state here; the real thing
   * would be a route under the team (`/teams/<id>/applicants`). A modal was
   * built beside it and compared; the page is what stayed (see
   * `RoleApplicants`).
   */
  const [applicantsRole, setApplicantsRole] = useState<string | null>(null);

  /**
   * THE APPLY FLOW, on this page.
   *
   * Every seat on this prototype is a signed-in member — there is no logged-out
   * view of a team profile here — so the flow opens past its account step:
   * `loggedIn`, nothing pending, and the viewer's profile already filled. The
   * steps that exist for a stranger arriving at the board are not reachable
   * from this surface and are not drawn on it.
   */
  const [flowRole, setFlowRole] = useState<IJobRole | null>(null);
  const [flowStep, setFlowStep] = useState<ApplyFlowStepId>('review');
  const [profile, setProfile] = useState<MemberProfile>(FILLED_PROFILE);
  /** Sent from this visit — the row then reports it in the clock ("Applied 2d
   *  ago") instead of offering the job again. One state, no pill: an
   *  application is a receipt, not a pipeline. */
  const [appliedRoleUids, setAppliedRoleUids] = useState<Set<string>>(new Set());
  const [appliedAtByRole, setAppliedAtByRole] = useState<Map<string, string>>(new Map());
  const saved = useSavedItems();
  const savedRoleUids = saved.uidsOf('job');

  const openJob = (role: IJobRole) => {
    setFlowRole(role);
    setFlowStep('review');
  };

  const submitApplication = (_coverLetter: string, followTeam: boolean) => {
    if (!flowRole) return;
    const uid = flowRole.uid;
    setAppliedRoleUids((prev) => new Set(prev).add(uid));
    setAppliedAtByRole((prev) => new Map(prev).set(uid, new Date().toISOString()));
    // The flow's own follow tick, honoured by the page that owns the Follow
    // pill — otherwise the drawer offers something the profile behind it
    // immediately contradicts.
    if (followTeam) setFollowing(true);
    setFlowRole(null);
  };

  const toggleRoleSave = (role: IJobRole) => {
    /* The board's own receipt, minus its press. There it reads "Saved. View
       saved roles", because the saved list is a tab on the same page; from a
       team profile that list is a different page, and sending someone off the
       team they came to read in order to look at the one role they just kept
       spends their place on a side errand. The word is the board's, so the two
       surfaces confirm the same act the same way. */
    if (saved.toggle(role.uid, 'job')) showListingToast('Saved.');
  };
  /**
   * The team's listings as the team sees them from its own page — the board's
   * `listings`, kept here for the length of a visit. Seeded the way the board
   * seeds the public roles (live, from the careers page), so a row reads the
   * same on both surfaces.
   *
   * The status is read here (the pill on a row that isn't live) and written
   * from the card: the drawer's footer is the listing's switch for this
   * viewer. It used to be written from the row's ⋯ as well, and that menu came
   * off — this is the page everyone reads. Delete went with it and has no
   * second door here, so there is no `deletedUids` any more; the board is
   * where a listing is removed.
   */
  const [roleListings, setRoleListings] = useState<Map<string, ListingMeta>>(() =>
    seedListingMeta(MOCK_TEAM_ROLES ? [{ teamUid: MOCK_TEAM_ROLES.team.uid, roles: MOCK_TEAM_ROLES.roles }] : []),
  );
  const [listingToast, setListingToast] = useState<string | null>(null);
  const listingToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showListingToast = (message: string) => {
    setListingToast(message);
    if (listingToastTimer.current) clearTimeout(listingToastTimer.current);
    listingToastTimer.current = setTimeout(() => setListingToast(null), 4000);
  };
  const roleTitle = (uid: string) => MOCK_TEAM_ROLES?.roles.find((r) => r.uid === uid)?.roleTitle ?? 'The listing';
  const setRoleStatus = (uid: string, status: ListingStatus) => {
    setRoleListings((prev) => {
      const meta = prev.get(uid);
      return meta ? new Map(prev).set(uid, { ...meta, status }) : prev;
    });
    // The board's own receipts, word for word: the part not on screen is what
    // the public board now does.
    showListingToast(
      status === 'inactive' ? `${roleTitle(uid)} is off the board.` : `${roleTitle(uid)} is back on the board.`,
    );
  };
  /** The section's group, or nothing. */
  const teamRoles = rolesSeed === 'some' ? MOCK_TEAM_ROLES : null;

  /**
   * The team's news, in state because the team can now add to it. Seeded from
   * the mocks; a posted item is prepended, so the rail, the archive, the mobile
   * page and the detail modal all read the same list.
   */
  const [news, setNews] = useState<NewsItemWithPost[]>(MOCK_NEWS);
  // Seeded through the mocked backend (see teamPosts.ts): an edit or a removal
  // made earlier in this tab is still in force after a reload — which is what
  // lets the network feed be checked and this page come back to the same state.
  useEffect(
    () => setNews(newsSeed === 'some' ? applyTeamPostOverrides(MOCK_NEWS, readTeamPostOverrides()) : []),
    [newsSeed],
  );
  const [composeOpen, setComposeOpen] = useState(false);
  /** The published post open in the compose modal for editing, if any. */
  const [editing, setEditing] = useState<NewsItemWithPost | null>(null);
  /** The post whose removal is being confirmed, if any. */
  const [removing, setRemoving] = useState<NewsItemWithPost | null>(null);
  /** The story just posted or saved — flashed in the rail so the press has a visible outcome. */
  const [flashUid, setFlashUid] = useState<string | null>(null);
  const railListRef = useRef<HTMLDivElement>(null);

  const publishNews = ({ title, body, url, summary }: PostNewsSubmission) => {
    const now = new Date().toISOString();
    const uid = `news-local-${Date.now()}`;
    const item: NewsItemWithPost = {
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
      isTeamPosted: true,
      post: { posterUid: TEAM_POST_VIEWER.uid, posterName: TEAM_POST_VIEWER.name },
    };
    setNews((prev) => [item, ...prev]);
    setFlashUid(uid);
  };

  /**
   * WHO MAY EDIT OR REMOVE. A directory admin, a lead of this team, or the
   * person who posted it — and only a post the team wrote here; enriched
   * coverage has no author on this page. One rule, asked by every surface (the
   * rail, the archive, the story modal) through `menuFor`, so a reader who may
   * not act meets no control anywhere rather than a disabled one somewhere.
   */
  const canManage = (item: NewsItemWithPost) => canManageTeamPost(item, view, TEAM_POST_VIEWER.uid);

  /**
   * Save an edit: the three fields the form owns, in place. The date stays —
   * an edit is a correction, not a new event — so the post keeps its place in
   * every list; the card gains "Edited". Written through to the mocked backend
   * so the network feed shows the same text.
   */
  const saveNews = (uid: string, { title, body, url, summary }: PostNewsSubmission) => {
    const patch = {
      title,
      summary,
      contentHtml: body || undefined,
      sourceUrl: url,
      sourceDomain: deriveDomain(url),
      editedAt: new Date().toISOString(),
    };
    setNews((prev) =>
      prev.map((item) => (item.uid === uid ? applyTeamPostOverrides([item], { [uid]: patch })[0] : item)),
    );
    writeTeamPostOverride(uid, patch);
    setFlashUid(uid);
  };

  /** Remove, after the confirm: gone from every list here and from the feed. */
  const removeNews = (item: NewsItemWithPost) => {
    setNews((prev) => prev.filter((n) => n.uid !== item.uid));
    writeTeamPostOverride(item.uid, { removed: true });
    setRemoving(null);
    // A story open in a modal has nothing left to show.
    if (detailUid === item.uid) setDetailUid(null);
    if (archiveStoryUid === item.uid) setArchiveStoryUid(null);
    showListingToast(`“${item.title}” removed.`);
  };

  /** The owner's ⋯ for a story — or nothing, which is what most readers get. */
  const menuFor = (uid: string) => {
    const item = news.find((n) => n.uid === uid);
    if (!item?.post || !canManage(item)) return null;
    return (
      <NewsPostMenu
        title={item.title}
        posterName={item.post.posterName}
        postedByViewer={item.post.posterUid === TEAM_POST_VIEWER.uid}
        onEdit={() => {
          setEditing(item);
          setComposeOpen(true);
        }}
        onRemove={() => setRemoving(item)}
      />
    );
  };

  // The receipt for a post — or a saved edit — is the post itself in the rail:
  // scroll it into view and flash it. A background flash rather than the archive's
  // ring: the rail's rows are flat and its list clips to a scroll region, so a
  // ring drawn around a row only ever shows its bottom edge — a thick blue
  // divider, not a highlight.
  useEffect(() => {
    if (!flashUid) return;
    const el = railListRef.current?.querySelector<HTMLElement>(`[data-news-uid="${flashUid}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add(local.newsPosted);
    const timer = setTimeout(() => {
      el.classList.remove(local.newsPosted);
      setFlashUid(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [flashUid]);
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
  // A uid, with the view derived from `news` on every render: an edit made
  // from inside the story shows in the story, and a removed one closes.
  const [detailUid, setDetailUid] = useState<string | null>(null);
  /** One payload shape, so a story reads the same from the rail and the archive. */
  const toDetail = (item: NewsItemWithPost): FeedDetail => ({
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
    authored: Boolean(item.post),
    bodyHtml: item.post ? item.contentHtml : undefined,
    editedAt: item.post?.editedAt,
  });
  const itemByUid = (uid: string | null) => (uid ? (news.find((n) => n.uid === uid) ?? null) : null);
  const detailItem = itemByUid(detailUid);
  const detail = detailItem ? toDetail(detailItem) : null;
  const openDetail = (item: ITeamNewsItem) => setDetailUid(item.uid);

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
  const [archiveStoryUid, setArchiveStoryUid] = useState<string | null>(null);
  const archiveStoryItem = itemByUid(archiveStoryUid);
  const archiveStory = archiveStoryItem ? toDetail(archiveStoryItem) : null;

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
    setArchiveStoryUid(null);
  };

  /** Drill into a story without leaving the archive. */
  const openArchiveStory = (item: ITeamNewsItem) => setArchiveStoryUid(item.uid);

  /**
   * Back to the list, focused on the story just left — the same scroll-and-flash
   * the rail's "Show more" uses, so the reader lands where they were rather than
   * at the top of a list they'd scrolled halfway down.
   */
  const backToArchiveList = () => {
    setNewsFocusUid(archiveStoryUid);
    setArchiveStoryUid(null);
  };

  const focusAreas = useGetFocusAreasToDisplay(MOCK_FOCUS_AREAS, MOCK_TEAM_FOCUS_AREAS);

  /**
   * AI Search, narrowed to this team. The door is on the team's own header
   * because nobody goes to the AI Search page (2 unique visitors in 90 days
   * against 1,998 on /teams): it goes where people already are. Every seat has
   * it — founders asking about their own team, visitors about someone else's.
   * It opens the AI Search view with the team as a chip in the field.
   *
   * The scope reads the page's own state, so its prompts follow what is drawn
   * for this seat: no applicants prompt for a member, no followers prompt or
   * "our" for a visitor, no roles prompt once the roles are gone, no news
   * prompt on an empty rail.
   */
  const [aiOpen, setAiOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const aiScope = buildTeamAiScope({
    teamName: team.name ?? 'this team',
    logo: teamLogo,
    members: MOCK_MEMBERS as unknown as TeamScopeInput['members'],
    roles: teamRoles?.roles ?? null,
    applicantsFor: (uid) => MOCK_APPLICANTS[uid] ?? [],
    canSeeApplicants: canSubmitJobs,
    isTeamView,
    followers: MOCK_FOLLOWERS,
    contributions: MOCK_CONTRIBUTIONS,
    news: displayNews,
    commentsFor: threadFor,
    onOpen: (target) => {
      if (target.startsWith('applicants:')) setApplicantsRole(target.slice('applicants:'.length));
      else if (target === 'followers') setFollowersOpen(true);
      else if (target === 'news') openNewsFeed(null);
      else scrollToSection(`team-${target}`);
    },
  });
  /* Ask AI sits in the header's action cluster, not beside the team name: a
     control abutting a 24px title reads as a tag on the name. No fill, no
     outline: it is a text action of the header's own lineage — the exact
     `Button` HeaderActionBtn renders for Edit (`link` + `primary`, default
     size, 4px icon gap), and the tone the search rows' "Ask AI" already wears.
     Rendered directly rather than through HeaderActionBtn only because that
     wrapper drops `aria-label`. Beside the outlined Follow pill it is plainly a
     different kind of control; beside Edit it is a sibling, told apart by the
     gradient glyph. One object in every seat. */
  const askAiButton = (seatClass?: string) => (
    <Button
      style="link"
      variant="primary"
      underline={false}
      className={clsx(local.askAiBtn, seatClass)}
      aria-label={`Ask AI about ${team.name}`}
      onClick={() => setAiOpen(true)}
    >
      <AiSearchIcon size={14} />
      <span>Ask AI</span>
    </Button>
  );

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
            {(
              [
                ['admin', 'Admin'],
                ['lead', 'Team lead'],
                ['member', 'Member'],
                ['public', 'Public'],
              ] as const
            ).map(([seat, label]) => (
              <button
                key={seat}
                type="button"
                className={`${local.demoBtn} ${view === seat ? local.demoBtnActive : ''}`}
                onClick={() => setView(seat)}
              >
                {label}
              </button>
            ))}
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
            {/* Undo this tab's edits and removals (the mocked backend is session
                storage) and put the fixture back as shipped. */}
            <button
              type="button"
              className={local.demoBtn}
              onClick={() => {
                clearTeamPostOverrides();
                setNewsSeed('some');
                setNews(MOCK_NEWS);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className={local.demoGroup}>
          <span className={local.demoLabel}>Roles</span>
          <div className={local.demoSwitch}>
            <button
              type="button"
              className={`${local.demoBtn} ${rolesSeed === 'some' ? local.demoBtnActive : ''}`}
              onClick={() => setRolesSeed('some')}
            >
              Hiring
            </button>
            <button
              type="button"
              className={`${local.demoBtn} ${rolesSeed === 'none' ? local.demoBtnActive : ''}`}
              onClick={() => setRolesSeed('none')}
            >
              None yet
            </button>
          </div>
        </div>

        {/* (A "Layout" group stood here while the applicants page compared five
            placements for View posting. Top of list won, so the group and
            `applicantsLayouts.ts` went — a review switch left up after the
            decision invites it to be re-litigated.) */}
      </div>

      {applicantsRole && teamRoles ? (
        /* The applicants page, in the profile's place — one press from the
           role row, Back returns here with the profile as it was. */
        <TeamApplicantsPage
          teamName={team.name ?? 'the team'}
          roles={teamRoles.roles.map((r) => ({
            uid: r.uid,
            title: r.roleTitle,
            postingHref: r.applyUrl ?? undefined,
            // The role row's own meta line, in its order: seniority · category · location.
            meta: [
              r.seniority ? seniorityDisplayLabel(r.seniority) : null,
              r.roleCategory,
              r.location?.length ? r.location.join(', ') : null,
            ]
              .filter(Boolean)
              .join(' · '),
            postedAt: getJobDate(r),
            applicants: MOCK_APPLICANTS[r.uid] ?? [],
            interested: MOCK_INTERESTED[r.uid] ?? [],
          }))}
          initialRoleUid={applicantsRole}
          onBack={() => setApplicantsRole(null)}
        />
      ) : (
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
                    !isTeamView ? (
                      <div className={`${local.followHeader} ${local.followClusterMobile}`}>
                        <div className={local.headerActionRow}>
                          {askAiButton()}
                          <FollowPill
                            following={following}
                            onToggle={handleFollowToggle}
                            name={team.name ?? 'this team'}
                          />
                        </div>
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
                          <TeamAdminActions
                            teamName={team.name ?? 'this team'}
                            leading={askAiButton(local.askAiFromTablet)}
                          />
                        </div>
                        {/* Phone: three actions in the absolute corner run over the
                          team name, so Ask AI leaves it and joins the row that
                          wraps under the tags — where the visitor's Ask AI
                          already sits on a phone. */}
                        {askAiButton(local.askAiMobileOnly)}
                        <TeamFollowBlock
                          count={followCount}
                          followers={MOCK_FOLLOWERS}
                          open={followersOpen}
                          onOpenChange={setFollowersOpen}
                        />
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
              <div id="team-members" className={`${shell.teamDetail__container__member} ${local.aiAnchor}`}>
                <TeamMembersView team={team} members={MOCK_MEMBERS} />
              </div>

              {/* Open roles — directly under Members because they're the same axis in
            two tenses: who's here, and who the team is looking for. Not in the
            news rail (that's a cross-surface stream, and 340px can't hold a role
            row); not near the top, because roles are perishable and most teams
            have none. Renders nothing when there are none — unless the reader
            can change that: a lead or admin gets the section in both states,
            with **Submit a job** in its header leading to the board's form,
            already on this team. */}
              <TeamOpenRolesView
                group={teamRoles}
                submitHref={canSubmitJobs ? submitJobHref(MOCK_TEAM.id) : undefined}
                onViewJob={openJob}
                savedRoleUids={savedRoleUids}
                onToggleSave={toggleRoleSave}
                appliedRoleUids={appliedRoleUids}
                appliedAtByRole={appliedAtByRole}
                owner={
                  canSubmitJobs
                    ? {
                        metaFor: (uid) => roleListings.get(uid),
                        applicantsFor: (uid) => MOCK_APPLICANTS[uid] ?? [],
                        openApplicants: setApplicantsRole,
                      }
                    : undefined
                }
              />

              {/* Focus areas — import-safe production view. */}
              <DetailsSection>
                <TeamFocusAreasView team={team} userInfo={null} focusAreas={focusAreas} toggleIsEditMode={() => {}} />
              </DetailsSection>

              {/* Contributions — event-primary tiles; Demo Day featured when present.
              Muted role tags, settled: the vibrant/muted switch was scaffolding
              for choosing between them, and it dies with the choice. */}
              <div id="team-contributions" className={local.aiAnchor}>
                <TeamContributionsView
                  contributions={MOCK_CONTRIBUTIONS}
                  demoDay={MOCK_TEAM_DEMO_DAY}
                  variant="muted"
                />
              </div>

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
                      menu={menuFor(item.uid)}
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
              menuFor={menuFor}
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
                menuFor={menuFor}
                isCommentLiked={(uid) => likedComments.has(uid)}
                onToggleCommentLike={toggleCommentLike}
              />
            )
          )}
        </div>
      )}

      {/* One story, in full — the feed's own modal. Rendered outside the news
          panel so it overlays the page, not the rail. */}
      <FeedDetailModal
        detail={detail}
        onClose={() => setDetailUid(null)}
        headerAction={detail ? menuFor(detail.id) : undefined}
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

      {/* Removing asks first — the same dialog the team's Delete and a listing's
          Delete use — because the press ends on a public feed and has no undo
          on this side. The one thing it says that the menu didn't: where the
          post stops appearing. */}
      <ConfirmDialog
        isOpen={Boolean(removing)}
        title="Remove Post"
        desc={
          removing
            ? `Are you sure you want to remove “${removing.title}”? It will no longer appear on ${team.name}’s page or in the network feed.`
            : ''
        }
        onClose={() => setRemoving(null)}
        onConfirm={() => removing && removeNews(removing)}
        confirmTitle="Remove"
      />

      {followToast && (
        <FollowToast>
          You&apos;re following <strong>{team.name}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}
      {listingToast && <FollowToast>{listingToast}</FollowToast>}

      {/* The job, read and applied to without leaving the team — the board's own
          drawer, so the role a person finds here and the role they find on
          /jobs are one thing to apply to. The owner presses the same row and
          gets the same drawer — you cannot apply to your own listing, so for
          them the footer is the listing's switch rather than Apply
          (`managed`). With the row's ⋯ gone, this is where taking a role down
          from this page happens. */}
      <JobApplyFlowDrawer
        open={!!flowRole}
        onClose={() => setFlowRole(null)}
        role={flowRole}
        team={MOCK_TEAM_ROLES?.team ?? null}
        step={flowStep}
        onStepChange={setFlowStep}
        profile={profile}
        onSaveProfile={setProfile}
        onSubmitApplication={submitApplication}
        followsTeam={following}
        /* Every seat here is signed in, so the account step is unreachable and
           these two are never called. They are required props, not dead
           branches this surface is choosing to skip. */
        onCreateAccount={() => {}}
        onSignIn={() => {}}
        loggedIn
        pendingApproval={false}
        applied={flowRole ? appliedRoleUids.has(flowRole.uid) : false}
        appliedAt={flowRole ? appliedAtByRole.get(flowRole.uid) : undefined}
        managed={
          flowRole && canSubmitJobs && roleListings.has(flowRole.uid)
            ? {
                status: roleListings.get(flowRole.uid)!.status,
                onSetStatus: (status) => setRoleStatus(flowRole.uid, status),
              }
            : undefined
        }
      />

      {/* The AI Search view, opened by "Ask AI about <team>" with the team as
          its scope — straight to the full screen, past the keyword popover,
          which has nothing to say about a team you are already on. Every seat
          has the door; the scope decides what each seat's prompts may read. */}
      <AiSearchView open={aiOpen} onClose={() => setAiOpen(false)} scope={aiScope} />

      {/* Compose and edit. Mounted for anyone on the team's side of the page —
          the compose door is still gated by `canPost`, but a lead or an admin
          can still correct or take down a post on a team that has since gone
          inactive. A visitor gets no modal: it owns a draft, and a draft for a
          person with nowhere to post is a leak. */}
      {isTeamView && (
        <PostNewsModal
          open={composeOpen}
          onClose={() => {
            setComposeOpen(false);
            setEditing(null);
          }}
          teamUid={team.id ?? 'protocol-labs'}
          teamName={team.name ?? 'This team'}
          existing={news}
          onPublish={publishNews}
          editing={editing}
          onSave={saveNews}
        />
      )}
    </div>
  );
}
