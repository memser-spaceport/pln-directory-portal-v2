import { usePostHog } from 'posthog-js/react';
import { useCurrentUserStore } from '@/services/auth/store';
import { EXPLORE_PL_NETWORK_ANALYTICS } from '@/utils/constants';

export type ExplorePortfolioView = 'map' | 'list';

/** A portfolio team as analytics sees it: marketing's logo id, the directory uid when matched. */
export type ExploreTeamParams = {
  logo_id: string;
  team_uid: string | null;
  island: string;
};

export const useExplorePlNetworkAnalytics = () => {
  const postHog = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (!postHog?.capture) return;
      const userInfo = useCurrentUserStore.getState().currentUser;
      const loggedInUserUid = userInfo?.uid;
      const loggedInUserEmail = userInfo?.email;
      const loggedInUserName = userInfo?.name;
      const is_authenticated = Boolean(loggedInUserUid);
      postHog.capture(eventName, {
        ...eventParams,
        is_authenticated,
        loggedInUserUid,
        loggedInUserEmail,
        loggedInUserName,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const onPageViewed = () => captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_PAGE_VIEWED);

  const onPortfolioViewChanged = (params: { view: ExplorePortfolioView }) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_PORTFOLIO_VIEW_CHANGED, params);

  const onMapTileOpened = (params: ExploreTeamParams) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_MAP_TILE_OPENED, params);

  const onTeamProfileClicked = (params: ExploreTeamParams & { source: ExplorePortfolioView }) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_TEAM_PROFILE_CLICKED, params);

  const onListShowAllToggled = (params: { expanded: boolean }) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_LIST_SHOW_ALL_TOGGLED, params);

  const onLogoWallShowAllToggled = (params: { expanded: boolean }) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_LOGO_WALL_SHOW_ALL_TOGGLED, params);

  const onEntityClicked = (params: { entity: string }) =>
    captureEvent(EXPLORE_PL_NETWORK_ANALYTICS.ON_ENTITY_CLICKED, params);

  return {
    onPageViewed,
    onPortfolioViewChanged,
    onMapTileOpened,
    onTeamProfileClicked,
    onListShowAllToggled,
    onLogoWallShowAllToggled,
    onEntityClicked,
  };
};
