import { TEAM_NEWS_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import type { ITeamNewsItem } from '@/types/team-news.types';

export type TeamNewsAnalyticsSource = 'home' | 'team-profile-rail' | 'team-profile-modal';

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

  const onTeamNewsCardClicked = (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_CARD_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      position,
      source,
    });
  };

  const onTeamNewsStartConversationClicked = (
    item: ITeamNewsItem,
    position: number,
    wasAnonymous: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_START_CONVERSATION_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      position,
      wasAnonymous,
      source,
    });
  };

  const onTeamNewsJoinDiscussionClicked = (
    item: ITeamNewsItem,
    position: number,
    wasAnonymous: boolean,
    source: TeamNewsAnalyticsSource,
  ) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_JOIN_DISCUSSION_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      forumTopicUrl: item.discussion.latestTopicUrl,
      discussionCount: item.discussion.count,
      position,
      wasAnonymous,
      source,
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
    onTeamNewsLoadMoreClicked,
    onTeamNewsViewAllClicked,
    onTeamNewsCardClicked,
    onTeamNewsStartConversationClicked,
    onTeamNewsJoinDiscussionClicked,
    onTeamNewsSearch,
  };
};
