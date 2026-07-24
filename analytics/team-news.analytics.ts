import { TEAM_NEWS_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import type { ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';

export type TeamNewsAnalyticsSource = 'home' | 'team-profile-rail' | 'team-profile-modal' | 'news-rail' | 'news-modal';

/** What a team-news-card-clicked actually did: opened the /home detail modal,
 *  or navigated to the source article (team-details surfaces). */
export type TeamNewsCardClickOutcome = 'modal' | 'source';

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

  const onTeamNewsViewAllClicked = (teamUid: string, teamName: string, total: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_VIEW_ALL_CLICKED, {
      teamUid,
      teamName,
      total,
      source: 'team-profile-rail' satisfies TeamNewsAnalyticsSource,
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

  const onTeamNewsCardClicked = (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => {
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
      // The same event name now means "opened the detail modal" on /home but
      // still "opened the source article" on team-details. Derived here — the
      // one place that knows source→surface semantics — so dashboards can
      // split without any call site changing.
      outcome: (source === 'home' ? 'modal' : 'source') satisfies TeamNewsCardClickOutcome,
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

  return {
    onTeamNewsTabClicked,
    onTeamNewsCategoryClicked,
    onTeamNewsSortChanged,
    onTeamNewsLoadMoreClicked,
    onTeamNewsViewAllClicked,
    onTeamNewsShowMoreClicked,
    onTeamNewsCardClicked,
    onTeamNewsDetailModalOpened,
    onTeamNewsShared,
    onTeamNewsSourcesExpanded,
    onTeamNewsSourceLinkClicked,
    onTeamNewsSearch,
    onTeamNewsUpvoteToggled,
    onTeamNewsPopularStoryClicked,
  };
};
