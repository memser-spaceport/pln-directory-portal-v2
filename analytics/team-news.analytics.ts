import { TEAM_NEWS_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import type { ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';
import type { IFeedForumPost } from '@/types/feed.types';
import type { CommentFailure } from '@/services/feed/commentFailure';

/** 'news' | 'forum' — typed off the FeedEntry union so analytics can't drift
 *  from the feed's own discriminator. */
export type FeedItemKind = import('@/components/page/home/TeamNews/utils/mergeFeedEntries').FeedEntry['kind'];

export type TeamNewsAnalyticsSource =
  | 'home'
  | 'team-profile-rail'
  | 'team-profile-modal'
  | 'news-rail'
  | 'news-modal'
  // The same archive modal, opened from a listing card's "N new posts" chip
  // rather than from a team profile. Distinct values because the question these
  // answer — does a chip on a directory page earn its place — can't be asked of
  // traffic that is pooled with the profile's.
  | 'teams-listing-modal'
  | 'job-board-modal'
  // The primary-team news card on a member profile. Kept apart from
  // 'team-profile-rail' for the same reason as the listing chips above: whether
  // news on a person's page earns its slot can't be asked of traffic pooled
  // with the team's own page.
  | 'member-profile'
  // That card's "View all news" archive — the same box the team profile opens,
  // over a person's page instead. Split from 'member-profile' on the same
  // grounds the listing modals above are split from the rail: the card is three
  // rows, this is the whole archive, and "did the archive earn its slot on a
  // person's page" cannot be asked of traffic pooled with the rows.
  | 'member-profile-modal';

/**
 * Surfaces that carry the "All network updates" exit — a team-scoped list, with
 * the feed one click away. Named once and shared with TeamNewsFeedLink's own
 * prop, so widening it is a single edit rather than two string lists that drift.
 */
export type TeamNewsFeedLinkSource = Extract<
  TeamNewsAnalyticsSource,
  | 'team-profile-rail'
  | 'team-profile-modal'
  | 'teams-listing-modal'
  | 'job-board-modal'
  | 'member-profile'
  | 'member-profile-modal'
>;

/** Where a "N new posts" chip was clicked. */
export type TeamNewsCountChipSource = 'teams-grid' | 'job-board';

/** What a team-news-card-clicked actually did: opened the detail modal, or
 *  navigated to the source article. */
export type TeamNewsCardClickOutcome = 'modal' | 'source';

/** Surfaces whose card click opens the story in a modal. Team-details rows used
 *  to leave for the source article; now that the profile renders the story
 *  itself — on the rail and drilled inside the archive — every listed surface
 *  opens the modal. The field stays (dashboards split on it, and a future
 *  surface may well go back to leaving for the source). */
const MODAL_OPENING_SOURCES: readonly TeamNewsAnalyticsSource[] = [
  'home',
  'team-profile-rail',
  'team-profile-modal',
  // The listing surfaces drill in place, exactly as the profile's archive does.
  // Omitting them here would label every one of those clicks `outcome: 'source'`
  // — reporting that the reader left for the publisher when they did not.
  'teams-listing-modal',
  'job-board-modal',
  // The member profile's card opens the story in place too. This list is
  // separate from the union above, so widening one without the other is exactly
  // how a surface ends up reporting `outcome: 'source'` for a modal it opened.
  'member-profile',
  // The archive opened from that card drills in place too, exactly as the team
  // profile's does.
  'member-profile-modal',
];

/** Which affordance opened the detail modal. On /home the comment badge is a
 *  disclosure toggle, so a comment intent only reaches the modal through the
 *  card thread's "View all" — the member read the thread first and wanted more
 *  of it. In the team profile's ~340px rail there is nowhere to unfold a thread,
 *  so the badge opens the story directly: that's `comments`. */
export type TeamNewsCardClickVia = 'row' | 'view-all-comments' | 'comments';

export type TeamNewsShareNetwork = 'linkedin' | 'x' | 'copy';

export const useTeamNewsAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (postHogProps?.capture) {
        const userInfo = useCurrentUserStore.getState().currentUser;
        postHogProps.capture(eventName, {
          ...eventParams,
          loggedInUserUid: userInfo?.uid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onTeamNewsTabClicked = (tab: string, itemCount: number, source: TeamNewsAnalyticsSource = 'home') => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TAB_CLICKED, {
      tab,
      itemCount,
      source,
    });
  };

  const onTeamNewsCategoryClicked = (
    category: string,
    itemCount: number,
    currentTab: string,
    source: TeamNewsAnalyticsSource = 'home',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_CATEGORY_CLICKED, {
      category,
      itemCount,
      currentTab,
      source,
    });
  };

  const onTeamNewsSortChanged = (
    sort: string,
    previousSort: string,
    itemCount: number,
    source: TeamNewsAnalyticsSource = 'home',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SORT_CHANGED, {
      sort,
      previousSort,
      itemCount,
      source,
    });
  };

  const onTeamNewsLoadMoreClicked = (
    currentlyShown: number,
    total: number,
    source: TeamNewsAnalyticsSource,
    extras: Record<string, unknown> = {},
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_LOAD_MORE_CLICKED, {
      currentlyShown,
      total,
      source,
      ...extras,
    });
  };

  /**
   * The staying half of the footer pair — the archive, not the feed.
   *
   * `source` names the surface whose archive was opened, and defaults to the
   * rail because that is the only place this button existed first. It used to be
   * hardcoded to that value inside the payload, which made the parameter list
   * read as source-agnostic while every caller reported as the team profile —
   * a new surface reusing the button would have filed its clicks as rail traffic
   * with nothing at the call site to give it away.
   */
  const onTeamNewsViewAllClicked = (
    teamUid: string,
    teamName: string,
    total: number,
    source: TeamNewsAnalyticsSource = 'team-profile-rail',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_VIEW_ALL_CLICKED, {
      teamUid,
      teamName,
      total,
      source,
    });
  };

  /** The leaving half of the rail/archive footer pair. `source` is which of the
   *  two lists the member left from — the rail preview and the full archive are
   *  different amounts of reading before the same decision to widen. */
  const onTeamNewsAllNetworkUpdatesClicked = (teamUid: string, teamName: string, source: TeamNewsFeedLinkSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_ALL_NETWORK_UPDATES_CLICKED, {
      teamUid,
      teamName,
      source,
    });
  };

  /** The "N new posts" chip on a listing card. `count` is what the chip claimed
   *  — the number is the offer, so a click-through rate is only readable against
   *  it (one waiting post and nine are not the same invitation). */
  const onTeamNewsCountChipClicked = (
    teamUid: string,
    teamName: string,
    count: number,
    source: TeamNewsCountChipSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_COUNT_CHIP_CLICKED, {
      teamUid,
      teamName,
      count,
      source,
    });
  };

  const onTeamNewsShowMoreClicked = (item: ITeamNewsItem, position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SHOW_MORE_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      position,
      source: 'team-profile-rail' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onTeamNewsCardClicked = (
    item: ITeamNewsItem,
    position: number,
    source: TeamNewsAnalyticsSource,
    via: TeamNewsCardClickVia = 'row',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_CARD_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      sourceCount: item.sourceUrls?.length ?? 1,
      position,
      source,
      via,
      // Derived here — the one place that knows source→surface semantics — so
      // dashboards can split without any call site changing.
      outcome: (MODAL_OPENING_SOURCES.includes(source) ? 'modal' : 'source') satisfies TeamNewsCardClickOutcome,
    });
  };

  // Fired on explicit click-open of the "N sources" popover only — the CSS
  // hover preview on pointer devices intentionally doesn't emit (it would fire
  // on every incidental mouse pass over the meta line).
  const onTeamNewsSourcesExpanded = (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SOURCES_EXPANDED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceCount: item.sourceUrls?.length ?? 1,
      position,
      source,
    });
  };

  const onTeamNewsSourceLinkClicked = (
    item: ITeamNewsItem,
    position: number,
    clicked: { domain: string; url: string },
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SOURCE_LINK_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceCount: item.sourceUrls?.length ?? 1,
      clickedDomain: clicked.domain,
      clickedUrl: clicked.url,
      isPrimary: clicked.url === item.sourceUrl,
      position,
      source,
    });
  };

  // Fired only for deep-link opens (trigger is fixed at 'deep-link'): row-click
  // opens are already captured by team-news-card-clicked with outcome 'modal' —
  // one event per user action.
  const onTeamNewsDetailModalOpened = (item: ITeamNewsItem) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_DETAIL_MODAL_OPENED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      trigger: 'deep-link',
    });
  };

  const onTeamNewsShared = (item: ITeamNewsItem, network: TeamNewsShareNetwork, source: TeamNewsAnalyticsSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SHARED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      network,
      source,
    });
  };

  const onTeamNewsUpvoteToggled = (
    item: ITeamNewsItem,
    position: number,
    nextState: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_UPVOTE_TOGGLED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      nextState,
      position,
      source,
    });
  };

  /** The rollback half of onTeamNewsUpvoteToggled. Without it the like funnel
   *  is measured on one side only, and an optimistic like that silently rolled
   *  back is indistinguishable from one that stuck. */
  const onTeamNewsUpvoteFailed = (
    item: ITeamNewsItem,
    position: number,
    attemptedState: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_UPVOTE_FAILED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      attemptedState,
      position,
      source,
    });
  };

  /** Its own event, not a shared one with news upvotes: the success events are
   *  separately named, and a shared failure event makes the ratio uncomputable
   *  for both. */
  const onFeedForumPostLikeFailed = (
    post: IFeedForumPost,
    position: number,
    attemptedState: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_FORUM_POST_LIKE_FAILED, {
      postUid: post.uid,
      authorMemberUid: post.author.memberUid,
      attemptedState,
      position,
      source,
    });
  };

  /** The suggestions card appeared with real teams on it (not its loading
   *  state). Once per appearance, not once per render. */
  const onTeamsToFollowViewed = (suggestionCount: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TEAMS_TO_FOLLOW_VIEWED, { suggestionCount });
  };

  /** …and it left, which in practice means the member followed all of them. */
  const onTeamsToFollowHidden = () => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TEAMS_TO_FOLLOW_HIDDEN, {});
  };

  /** The Popular-this-week card appeared with stories on it — the denominator
   *  for its click-through, which was measured with no impression count. */
  const onTopStoriesBlockViewed = (leadUid: string, rowCount: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TOP_STORIES_BLOCK_VIEWED, {
      leadUid,
      rowCount,
      source: 'home' satisfies TeamNewsAnalyticsSource,
    });
  };

  /** Block items aren't in `visibleEntries`, so the feed's position lookup
   *  reports -1 for all of them — the block passes its own slot and position
   *  instead. `slot` separates the lead's pull from the runners-up's, which is
   *  the only way to tell whether the asymmetry is earning anything. */
  const onTopStoryClicked = (item: ITeamNewsItem, slot: 'lead' | 'row', position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TOP_STORY_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      upvoteCount: item.upvoteCount ?? 0,
      slot,
      position,
      source: 'home' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onFeedHiringRoleClicked = (
    group: { team: { uid: string; name: string }; totalRoles: number },
    role: { uid: string; roleTitle: string },
    rolePosition: number,
    feedPosition: number,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_HIRING_ROLE_CLICKED, {
      teamUid: group.team.uid,
      teamName: group.team.name,
      roleUid: role.uid,
      roleTitle: role.roleTitle,
      totalRoles: group.totalRoles,
      rolePosition,
      position: feedPosition,
      source: 'home' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onFeedHiringViewAllClicked = (
    group: { team: { uid: string; name: string }; totalRoles: number },
    feedPosition: number,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_HIRING_VIEW_ALL_CLICKED, {
      teamUid: group.team.uid,
      teamName: group.team.name,
      totalRoles: group.totalRoles,
      position: feedPosition,
      source: 'home' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onFeedDealClicked = (
    deal: { uid: string; vendorName: string; category: string; audience: string },
    feedPosition: number,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_DEAL_CLICKED, {
      dealUid: deal.uid,
      vendorName: deal.vendorName,
      category: deal.category,
      audience: deal.audience,
      position: feedPosition,
      source: 'home' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onPopularCardViewed = (itemCount: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_POPULAR_CARD_VIEWED, { itemCount });
  };

  /** The popular rail's two outcomes. Its click event fires either way, so
   *  clicked minus these two is the "flushSync should have made this
   *  impossible" case. */
  const onPopularStoryScrollSucceeded = (item: ITeamNewsPopularItem, position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_POPULAR_STORY_SCROLL_SUCCEEDED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      position,
    });
  };

  /** The story aged out of the 14-day window after Popular was ranked, so the
   *  click opened the source article instead of scrolling to a card. */
  const onPopularStoryFallbackOpened = (item: ITeamNewsPopularItem, position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_POPULAR_STORY_FALLBACK_OPENED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      position,
    });
  };

  const onTeamNewsPopularStoryClicked = (item: ITeamNewsPopularItem, position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_POPULAR_STORY_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      upvoteCount: item.upvoteCount,
      position,
      source: 'news-rail' satisfies TeamNewsAnalyticsSource,
    });
  };

  const onTeamNewsSearch = (
    searchValue: string,
    resultCount: number,
    currentTab: string,
    currentCategory: string,
    source: TeamNewsAnalyticsSource = 'home',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_SEARCH_REQUESTED, {
      searchValue,
      resultCount,
      currentTab,
      currentCategory,
      source,
    });
  };

  // ---- Feed social layer (forum posts in the feed + feed-only comments) ----
  // Privacy rule: no event ever carries a forum-post uid for a viewer who
  // failed the access gate (e.g. a stripped ?post= deep link) — these fire only
  // from surfaces the viewer was allowed to render.

  const onFeedForumPostCardClicked = (
    post: IFeedForumPost,
    position: number,
    source: TeamNewsAnalyticsSource,
    via: TeamNewsCardClickVia = 'row',
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_FORUM_POST_CARD_CLICKED, {
      postUid: post.uid,
      authorMemberUid: post.author.memberUid,
      category: post.category,
      position,
      source,
      via,
    });
  };

  // Deep-link opens only — row clicks are covered by onFeedForumPostCardClicked,
  // matching onTeamNewsDetailModalOpened's one-event-per-user-action convention.
  const onFeedForumPostModalOpened = (post: IFeedForumPost) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_FORUM_POST_MODAL_OPENED, {
      postUid: post.uid,
      authorMemberUid: post.author.memberUid,
      category: post.category,
      trigger: 'deep-link',
    });
  };

  const onFeedForumPostLikeToggled = (
    post: IFeedForumPost,
    position: number,
    nextState: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_FORUM_POST_LIKE_TOGGLED, {
      postUid: post.uid,
      authorMemberUid: post.author.memberUid,
      nextState,
      position,
      source,
    });
  };

  const onFeedForumPostShared = (
    post: IFeedForumPost,
    network: TeamNewsShareNetwork,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_FORUM_POST_SHARED, {
      postUid: post.uid,
      authorMemberUid: post.author.memberUid,
      network,
      source,
    });
  };

  // Fires from the card only — the modal's thread is always expanded, so there
  // is nothing to toggle there. This is the only signal for "opened a thread
  // without opening the story", which is now the common path.
  const onFeedCommentThreadToggled = (
    itemUid: string,
    kind: FeedItemKind,
    open: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_THREAD_TOGGLED, {
      itemUid,
      kind,
      open,
      source,
    });
  };

  const onFeedCommentSubmitted = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    isReply = false,
    mentionsCount = 0,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_SUBMITTED, {
      itemUid,
      kind,
      source,
      isReply,
      mentionsCount,
    });
  };

  // ── Comment failures and drop-offs ────────────────────────────────────────
  // House rule for every event below: no comment text, no draft, no full URL,
  // no raw server message. Reasons and counts only.

  const onFeedCommentFailed = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    isReply: boolean,
    failure: CommentFailure,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_FAILED, {
      itemUid,
      kind,
      source,
      isReply,
      ...failure,
    });
  };

  const onFeedCommentDeleted = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    /** Rows removed including the cascaded replies — tells apart deleting a
     *  leaf from deleting a whole conversation. */
    removedCount: number,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_DELETED, {
      itemUid,
      kind,
      source,
      removedCount,
    });
  };

  const onFeedCommentDeleteFailed = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    failure: CommentFailure,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_DELETE_FAILED, {
      itemUid,
      kind,
      source,
      ...failure,
    });
  };

  // The guest→member funnel, from inside a thread. Fires before a soft #login
  // nav, so unlike the session-expired path it delivers reliably.
  const onFeedCommentSignInClicked = (itemUid: string, kind: FeedItemKind, source: TeamNewsAnalyticsSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_SIGNIN_CLICKED, { itemUid, kind, source });
  };

  const onFeedCommentLoadFailed = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    /** The thread rendered its error state while cached comments existed, so
     *  the member saw a failure over content that was actually there. */
    hadCachedData: boolean,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_LOAD_FAILED, {
      itemUid,
      kind,
      source,
      hadCachedData,
    });
  };

  const onFeedCommentRetryClicked = (itemUid: string, kind: FeedItemKind, source: TeamNewsAnalyticsSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_RETRY_CLICKED, { itemUid, kind, source });
  };

  /** `host` ONLY — a pasted URL's path or query can carry a token or a private
   *  document id. A mailto link reports no host at all. */
  const onFeedCommentLinkClicked = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    link: { linkType: 'http' | 'mailto'; host?: string },
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_LINK_CLICKED, {
      itemUid,
      kind,
      source,
      ...link,
    });
  };

  const onFeedCommentMentionClicked = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    targetMemberUid: string,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_MENTION_CLICKED, {
      itemUid,
      kind,
      source,
      targetMemberUid,
    });
  };

  // Never include comment text or the draft here — only the selection.
  const onFeedCommentMentionSelected = (
    itemUid: string,
    kind: FeedItemKind,
    source: TeamNewsAnalyticsSource,
    mention: { memberUid: string; memberName: string },
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_FEED_COMMENT_MENTION_SELECTED, {
      itemUid,
      kind,
      source,
      ...mention,
    });
  };

  return {
    onTeamNewsTabClicked,
    onTeamNewsCategoryClicked,
    onTeamNewsSortChanged,
    onTeamNewsLoadMoreClicked,
    onTeamNewsViewAllClicked,
    onTeamNewsAllNetworkUpdatesClicked,
    onTeamNewsCountChipClicked,
    onTeamNewsShowMoreClicked,
    onTeamNewsCardClicked,
    onTeamNewsDetailModalOpened,
    onTeamNewsShared,
    onTeamNewsSourcesExpanded,
    onTeamNewsSourceLinkClicked,
    onTeamNewsSearch,
    onTeamNewsUpvoteToggled,
    onTeamNewsUpvoteFailed,
    onFeedForumPostLikeFailed,
    onTeamNewsPopularStoryClicked,
    onPopularCardViewed,
    onPopularStoryScrollSucceeded,
    onPopularStoryFallbackOpened,
    onTopStoriesBlockViewed,
    onTopStoryClicked,
    onFeedHiringRoleClicked,
    onFeedHiringViewAllClicked,
    onFeedDealClicked,
    onTeamsToFollowViewed,
    onTeamsToFollowHidden,
    onFeedForumPostCardClicked,
    onFeedForumPostModalOpened,
    onFeedForumPostLikeToggled,
    onFeedForumPostShared,
    onFeedCommentThreadToggled,
    onFeedCommentSubmitted,
    onFeedCommentMentionSelected,
    onFeedCommentFailed,
    onFeedCommentDeleted,
    onFeedCommentDeleteFailed,
    onFeedCommentSignInClicked,
    onFeedCommentLoadFailed,
    onFeedCommentRetryClicked,
    onFeedCommentLinkClicked,
    onFeedCommentMentionClicked,
  };
};
