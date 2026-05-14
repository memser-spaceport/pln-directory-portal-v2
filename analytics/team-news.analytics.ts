import { TEAM_NEWS_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import type { ITeamNewsItem } from '@/types/team-news.types';

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

  const onTeamNewsTabClicked = (tab: string, itemCount: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_TAB_CLICKED, {
      tab,
      itemCount,
    });
  };

  const onTeamNewsCategoryClicked = (category: string, itemCount: number, currentTab: string) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_CATEGORY_CLICKED, {
      category,
      itemCount,
      currentTab,
    });
  };

  const onTeamNewsLoadMoreClicked = (currentlyShown: number, total: number, currentTab: string, currentCategory: string) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_LOAD_MORE_CLICKED, {
      currentlyShown,
      total,
      currentTab,
      currentCategory,
    });
  };

  const onTeamNewsCardClicked = (item: ITeamNewsItem, position: number) => {
    captureEvent(TEAM_NEWS_ANALYTICS_EVENTS.TEAM_NEWS_CARD_CLICKED, {
      itemUid: item.uid,
      teamUid: item.teamUid,
      teamName: item.teamName,
      eventType: item.eventType,
      sourceDomain: item.sourceDomain,
      sourceUrl: item.sourceUrl,
      position,
    });
  };

  return {
    onTeamNewsTabClicked,
    onTeamNewsCategoryClicked,
    onTeamNewsLoadMoreClicked,
    onTeamNewsCardClicked,
  };
};
