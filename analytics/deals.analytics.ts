import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

const DEALS_ANALYTICS_EVENTS = {
  DEALS_PAGE_VIEWED: 'deals-page-viewed',
  DEALS_REPORT_PROBLEM_OPENED: 'deals-report-problem-opened',
  DEALS_REPORT_PROBLEM_SUBMITTED: 'deals-report-problem-submitted',
  DEALS_SUBMIT_MODAL_CLOSED: 'deals-submit-modal-closed',
  DEALS_SUBMIT_SUCCESS_VIEWED: 'deals-submit-success-viewed',
  DEALS_SUBMIT_SUCCESS_CLOSED: 'deals-submit-success-closed',
  DEALS_REDEEM_SUCCEEDED: 'deals-redeem-succeeded',
  DEALS_TOGGLE_USING_SUCCEEDED: 'deals-toggle-using-succeeded',
  DEALS_EMPTY_RESULTS_SHOWN: 'deals-empty-results-shown',
  DEALS_ACCESS_DENIED_REDIRECT: 'deals-access-denied-redirect',
  DEALS_DETAIL_NOT_FOUND: 'deals-detail-not-found',
  DEALS_CARD_CLICKED: 'deals-card-clicked',
  DEALS_FILTER_APPLIED: 'deals-filter-applied',
  DEALS_FILTER_CLEARED: 'deals-filter-cleared',
  DEALS_SORT_CHANGED: 'deals-sort-changed',
  DEALS_SHOW_MORE_CLICKED: 'deals-show-more-clicked',
  DEALS_SEARCH_PERFORMED: 'deals-search-performed',
  DEALS_DETAIL_VIEWED: 'deals-detail-viewed',
  DEALS_REDEEM_CLICKED: 'deals-redeem-clicked',
  DEALS_TOGGLE_USING_CLICKED: 'deals-toggle-using-clicked',
  DEALS_BACK_CLICKED: 'deals-back-clicked',
  DEALS_SUBMIT_MODAL_OPENED: 'deals-submit-modal-opened',
  DEALS_DEAL_SUBMITTED: 'deals-deal-submitted',
  DEALS_DEAL_SUBMIT_FAILED: 'deals-deal-submit-failed',
  DEALS_REQUEST_MODAL_CLOSED: 'deals-request-modal-closed',
  DEALS_REQUEST_SUBMITTED: 'deals-request-submitted',
  DEALS_REQUEST_BUTTON_CLICKED: 'deals-request-button-clicked',
  DEALS_REQUEST_SUCCEEDED: 'deals-request-succeeded',
  DEALS_REQUEST_SUBMIT_FAILED: 'deals-request-submit-failed',
  DEALS_LANDING_VIEWED: 'deals-landing-viewed',
  DEALS_LANDING_LIST_PRODUCT_CLICKED: 'deals-landing-list-product-clicked',
  DEALS_LANDING_SIGN_IN_CLICKED: 'deals-landing-sign-in-clicked',
  DEALS_NO_ACCESS_MODAL_VIEWED: 'deals-no-access-modal-viewed',
};

export function useDealsAnalytics() {
  const posthog = usePostHog();

  const trackDealCardClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_CARD_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackFilterApplied = useCallback(
    (filterType: string, values: string[]) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_FILTER_APPLIED, { filterType, values });
    },
    [posthog],
  );

  const trackFilterCleared = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_FILTER_CLEARED);
  }, [posthog]);

  const trackSortChanged = useCallback(
    (sort: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SORT_CHANGED, { sort });
    },
    [posthog],
  );

  const trackShowMoreClicked = useCallback(
    (page: number) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SHOW_MORE_CLICKED, { page });
    },
    [posthog],
  );

  const trackSearchPerformed = useCallback(
    (query: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SEARCH_PERFORMED, { query });
    },
    [posthog],
  );

  const trackDealDetailViewed = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DETAIL_VIEWED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackRedeemClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REDEEM_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackToggleUsingClicked = useCallback(
    (dealId: string, dealTitle: string, isUsing: boolean) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_TOGGLE_USING_CLICKED, { dealId, dealTitle, isUsing });
    },
    [posthog],
  );

  const trackBackClicked = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_BACK_CLICKED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackSubmitModalOpened = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SUBMIT_MODAL_OPENED);
  }, [posthog]);

  const trackDealSubmitted = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DEAL_SUBMITTED);
  }, [posthog]);

  const trackDealSubmitFailed = useCallback(
    (error: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DEAL_SUBMIT_FAILED, { error });
    },
    [posthog],
  );

  const trackDealsPageViewed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_PAGE_VIEWED);
  }, [posthog]);

  const trackReportProblemOpened = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REPORT_PROBLEM_OPENED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackReportProblemSubmitted = useCallback(
    (dealId: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REPORT_PROBLEM_SUBMITTED, { dealId });
    },
    [posthog],
  );

  const trackSubmitModalClosed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SUBMIT_MODAL_CLOSED);
  }, [posthog]);

  const trackSubmitSuccessViewed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SUBMIT_SUCCESS_VIEWED);
  }, [posthog]);

  const trackSubmitSuccessClosed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_SUBMIT_SUCCESS_CLOSED);
  }, [posthog]);

  const trackRequestModalClosed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REQUEST_MODAL_CLOSED);
  }, [posthog]);

  const trackRequestButtonClicked = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REQUEST_BUTTON_CLICKED);
  }, [posthog]);

  const trackRequestSubmitClicked = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REQUEST_SUBMITTED);
  }, [posthog]);

  const trackRequestSucceeded = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REQUEST_SUCCEEDED);
  }, [posthog]);

  const trackRequestDealSubmitFailed = useCallback(
    (error: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REQUEST_SUBMIT_FAILED, { error });
    },
    [posthog],
  );

  const trackRedeemSucceeded = useCallback(
    (dealId: string, dealTitle: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_REDEEM_SUCCEEDED, { dealId, dealTitle });
    },
    [posthog],
  );

  const trackToggleUsingSucceeded = useCallback(
    (dealId: string, dealTitle: string, isUsing: boolean) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_TOGGLE_USING_SUCCEEDED, { dealId, dealTitle, isUsing });
    },
    [posthog],
  );

  const trackEmptyResultsShown = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_EMPTY_RESULTS_SHOWN);
  }, [posthog]);

  const trackAccessDeniedRedirect = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_ACCESS_DENIED_REDIRECT);
  }, [posthog]);

  const trackDealDetailNotFound = useCallback(
    (dealId: string) => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_DETAIL_NOT_FOUND, { dealId });
    },
    [posthog],
  );

  const trackDealsLandingViewed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_LANDING_VIEWED);
  }, [posthog]);

  const trackDealsLandingListProductClicked = useCallback(
    (placement: 'hero' | 'footer') => {
      posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_LANDING_LIST_PRODUCT_CLICKED, { placement });
    },
    [posthog],
  );

  const trackDealsLandingSignInClicked = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_LANDING_SIGN_IN_CLICKED);
  }, [posthog]);

  const trackDealsNoAccessModalViewed = useCallback(() => {
    posthog?.capture(DEALS_ANALYTICS_EVENTS.DEALS_NO_ACCESS_MODAL_VIEWED);
  }, [posthog]);

  return {
    trackDealsPageViewed,
    trackReportProblemOpened,
    trackReportProblemSubmitted,
    trackSubmitModalClosed,
    trackSubmitSuccessViewed,
    trackSubmitSuccessClosed,
    trackRedeemSucceeded,
    trackToggleUsingSucceeded,
    trackEmptyResultsShown,
    trackAccessDeniedRedirect,
    trackDealDetailNotFound,
    trackDealCardClicked,
    trackFilterApplied,
    trackFilterCleared,
    trackSortChanged,
    trackShowMoreClicked,
    trackSearchPerformed,
    trackDealDetailViewed,
    trackRedeemClicked,
    trackToggleUsingClicked,
    trackBackClicked,
    trackSubmitModalOpened,
    trackDealSubmitted,
    trackDealSubmitFailed,
    trackRequestModalClosed,
    trackRequestButtonClicked,
    trackRequestSubmitClicked,
    trackRequestSucceeded,
    trackRequestDealSubmitFailed,
    trackDealsLandingViewed,
    trackDealsLandingListProductClicked,
    trackDealsLandingSignInClicked,
    trackDealsNoAccessModalViewed,
  };
}
