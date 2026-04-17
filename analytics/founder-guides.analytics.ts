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
  SCHEDULE_MEETING_CLICKED: 'founder-guides-schedule-meeting-clicked',
  REQUEST_LINK_CLICKED: 'founder-guides-request-link-clicked',
  REQUEST_PAGE_VIEWED: 'founder-guides-request-page-viewed',
  REQUEST_FORM_FIELD_EDITED: 'founder-guides-request-form-field-edited',
  REQUEST_SUBMITTED: 'founder-guides-request-submitted',
  REQUEST_CANCELLED: 'founder-guides-request-cancelled',
  COMMENT_SUBMITTED: 'founder-guides-comment-submitted',
  COMMENT_REPLY_SUBMITTED: 'founder-guides-comment-reply-submitted',
  COMMENT_EDIT_SUBMITTED: 'founder-guides-comment-edit-submitted',
  COMMENT_DELETED: 'founder-guides-comment-deleted',
  COMMENT_LIKED: 'founder-guides-comment-liked',
  COMMENT_REPLY_CLICKED: 'founder-guides-comment-reply-clicked',
} as const;

export type FounderGuidesScheduleMeetingClickedParams =
  | {
      articleUid: string;
      slug: string;
      meetingLinkType: 'member';
      memberUid: string;
      memberName: string;
    }
  | {
      articleUid: string;
      slug: string;
      meetingLinkType: 'team';
      teamUid: string;
      teamName: string;
    };

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

  const trackScheduleMeetingClicked = useCallback(
    (params: FounderGuidesScheduleMeetingClickedParams) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.SCHEDULE_MEETING_CLICKED, params);
    },
    [posthog],
  );

  const trackRequestGuideLinkClicked = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.REQUEST_LINK_CLICKED);
  }, [posthog]);

  const trackRequestGuidePageViewed = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.REQUEST_PAGE_VIEWED);
  }, [posthog]);

  const trackRequestGuideFormFieldEdited = useCallback(
    (params: { field: 'title' | 'description' }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.REQUEST_FORM_FIELD_EDITED, params);
    },
    [posthog],
  );

  const trackRequestGuideSubmitted = useCallback(
    (params: { titleLength: number; descriptionLength: number }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.REQUEST_SUBMITTED, params);
    },
    [posthog],
  );

  const trackRequestGuideCancelled = useCallback(() => {
    posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.REQUEST_CANCELLED);
  }, [posthog]);

  const trackCommentSubmitted = useCallback(
    (params: { articleUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_SUBMITTED, params);
    },
    [posthog],
  );

  const trackCommentReplySubmitted = useCallback(
    (params: { articleUid: string; parentUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_REPLY_SUBMITTED, params);
    },
    [posthog],
  );

  const trackCommentEditSubmitted = useCallback(
    (params: { articleUid: string; commentUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_EDIT_SUBMITTED, params);
    },
    [posthog],
  );

  const trackCommentDeleted = useCallback(
    (params: { articleUid: string; commentUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_DELETED, params);
    },
    [posthog],
  );

  const trackCommentLiked = useCallback(
    (params: { articleUid: string; commentUid: string; liked: boolean }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_LIKED, params);
    },
    [posthog],
  );

  const trackCommentReplyClicked = useCallback(
    (params: { articleUid: string; parentUid: string }) => {
      posthog?.capture(FOUNDER_GUIDES_ANALYTICS_EVENTS.COMMENT_REPLY_CLICKED, params);
    },
    [posthog],
  );

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
    trackScheduleMeetingClicked,
    trackRequestGuideLinkClicked,
    trackRequestGuidePageViewed,
    trackRequestGuideFormFieldEdited,
    trackRequestGuideSubmitted,
    trackRequestGuideCancelled,
    trackCommentSubmitted,
    trackCommentReplySubmitted,
    trackCommentEditSubmitted,
    trackCommentDeleted,
    trackCommentLiked,
    trackCommentReplyClicked,
  };
}
