import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const FOUNDER_GUIDES_ANALYTICS_EVENTS = {
  OVERVIEW_VIEWED: 'founder-guides-overview-viewed',
  SIDEBAR_SEARCH: 'founder-guides-sidebar-search',
  ARTICLE_VIEWED: 'founder-guides-article-viewed',
  ARTICLE_LIKED: 'founder-guides-article-liked',
  ARTICLE_EDIT_BUTTON_CLICKED: 'founder-guides-article-edit-button-clicked',
  ARTICLE_BACK_CLICKED: 'founder-guides-article-back-clicked',
  CREATE_PAGE_OPENED: 'founder-guides-create-page-opened',
  ARTICLE_CREATE_SUBMITTED: 'founder-guides-article-create-submitted',
  ARTICLE_EDIT_SUBMITTED: 'founder-guides-article-edit-submitted',
  FORM_CANCELLED: 'founder-guides-article-form-cancelled',
  MOBILE_NAV_OPENED: 'founder-guides-mobile-nav-opened',
} as const;

export function useFounderGuidesAnalytics() {
  const posthog = usePostHog();

  const trackOverviewViewed = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.OVERVIEW_VIEWED);
  }, [posthog]);

  const trackSidebarSearch = useCallback(
    (query: string) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.SIDEBAR_SEARCH, { query });
    },
    [posthog],
  );

  const trackArticleViewed = useCallback(
    (params: { articleUid: string; slug: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_VIEWED, params);
    },
    [posthog],
  );

  const trackArticleLiked = useCallback(
    (params: { articleUid: string; liked: boolean }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_LIKED, params);
    },
    [posthog],
  );

  const trackArticleEditButtonClicked = useCallback(
    (params: { articleUid: string; slug: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_EDIT_BUTTON_CLICKED, params);
    },
    [posthog],
  );

  const trackArticleBackClicked = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_BACK_CLICKED);
  }, [posthog]);

  const trackCreatePageOpened = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.CREATE_PAGE_OPENED);
  }, [posthog]);

  const trackArticleCreateSubmitted = useCallback(
    (params: { articleUid?: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_CREATE_SUBMITTED, params);
    },
    [posthog],
  );

  const trackArticleEditSubmitted = useCallback(
    (params: { articleUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.ARTICLE_EDIT_SUBMITTED, params);
    },
    [posthog],
  );

  const trackFormCancelled = useCallback(
    (params: { isEditMode: boolean }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.FORM_CANCELLED, params);
    },
    [posthog],
  );

  const trackMobileNavOpened = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.MOBILE_NAV_OPENED);
  }, [posthog]);

  return {
    trackOverviewViewed,
    trackSidebarSearch,
    trackArticleViewed,
    trackArticleLiked,
    trackArticleEditButtonClicked,
    trackArticleBackClicked,
    trackCreatePageOpened,
    trackArticleCreateSubmitted,
    trackArticleEditSubmitted,
    trackFormCancelled,
    trackMobileNavOpened,
  };
}
