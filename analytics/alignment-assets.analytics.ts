import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

// Activity analytics params interface
interface IActivityAnalyticsParams {
  activityId: string;
  activityName: string;
  category: string;
  points: string;
}

export const useAlignmentAssetsAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const ALIGNMENT_ASSETS_ANALYTICS_EVENTS = {
    // Navigation & Menu
    NAV_MENU_CLICKED: 'alignment-assets-nav-menu-clicked',
    BACK_BUTTON_CLICKED: 'alignment-assets-back-button-clicked',
    ROUND_SELECTOR_OPENED: 'alignment-assets-round-selector-opened',
    ROUND_SELECTOR_PREV_CLICKED: 'alignment-assets-round-selector-prev-clicked',
    ROUND_SELECTOR_NEXT_CLICKED: 'alignment-assets-round-selector-next-clicked',
    ROUND_SELECTOR_GO_TO_CURRENT_CLICKED: 'alignment-assets-round-selector-go-to-current-clicked',

    // Overview Page
    OVERVIEW_CREATE_ACCOUNT_CLICKED: 'alignment-assets-overview-create-account-clicked',
    OVERVIEW_WAITLIST_FORM_CLICKED: 'alignment-assets-overview-waitlist-form-clicked',
    OVERVIEW_LEARN_MORE_CLICKED: 'alignment-assets-overview-learn-more-clicked',
    OVERVIEW_FAQ_LINK_CLICKED: 'alignment-assets-overview-faq-link-clicked',

    // Incentive Model Page
    INCENTIVE_MODEL_ACTIVITIES_LINK_CLICKED: 'alignment-assets-incentive-model-activities-link-clicked',
    INCENTIVE_MODEL_ROUND_DROPDOWN_OPENED: 'alignment-assets-incentive-model-round-dropdown-opened',
    INCENTIVE_MODEL_PREV_ROUND_CLICKED: 'alignment-assets-incentive-model-prev-round-clicked',
    INCENTIVE_MODEL_NEXT_ROUND_CLICKED: 'alignment-assets-incentive-model-next-round-clicked',
    INCENTIVE_MODEL_GO_TO_CURRENT_CLICKED: 'alignment-assets-incentive-model-go-to-current-clicked',
    INCENTIVE_MODEL_ROUND_INPUT_CHANGED: 'alignment-assets-incentive-model-round-input-changed',
    INCENTIVE_MODEL_TIP_VIEW_LINK_CLICKED: 'alignment-assets-incentive-model-tip-view-link-clicked',
    INCENTIVE_MODEL_LEARN_MORE_CLICKED: 'alignment-assets-incentive-model-learn-more-clicked',

    // Activities Page
    ACTIVITIES_SUBMIT_BTN_CLICKED: 'alignment-assets-activities-submit-btn-clicked',
    ACTIVITIES_SUGGEST_LINK_CLICKED: 'alignment-assets-activities-suggest-link-clicked',
    ACTIVITIES_ROW_CLICKED: 'alignment-assets-activities-row-clicked',
    ACTIVITIES_FORM_LINK_CLICKED: 'alignment-assets-activities-form-link-clicked',
    ACTIVITIES_MODAL_CLOSED: 'alignment-assets-activities-modal-closed',
    ACTIVITIES_MODAL_LINK_CLICKED: 'alignment-assets-activities-modal-link-clicked',

    // Rounds Page - Hero Section
    ROUNDS_HERO_BTN_CLICKED: 'alignment-assets-rounds-hero-btn-clicked',

    // Snapshot Progress Section
    SNAPSHOT_TIP_LINK_CLICKED: 'alignment-assets-snapshot-tip-link-clicked',

    // Leaderboard Section
    LEADERBOARD_VIEW_TOGGLE_CLICKED: 'alignment-assets-leaderboard-view-toggle-clicked',
    LEADERBOARD_SEARCH_USED: 'alignment-assets-leaderboard-search-used',
    LEADERBOARD_SHOW_MORE_CLICKED: 'alignment-assets-leaderboard-show-more-clicked',

    // Buyback Auction Section
    BUYBACK_SHOW_MORE_CLICKED: 'alignment-assets-buyback-show-more-clicked',

    // Learn More Section
    LEARN_MORE_FAQ_CLICKED: 'alignment-assets-learn-more-faq-clicked',

    // Support Section
    SUPPORT_OFFICE_HOURS_CLICKED: 'alignment-assets-support-office-hours-clicked',
    SUPPORT_EMAIL_CLICKED: 'alignment-assets-support-email-clicked',

    // FAQs Page
    FAQS_SEARCH_USED: 'alignment-assets-faqs-search-used',
    FAQS_EXPAND_ALL_CLICKED: 'alignment-assets-faqs-expand-all-clicked',
    FAQS_QUESTION_TOGGLED: 'alignment-assets-faqs-question-toggled',
    FAQS_CLEAR_SEARCH_CLICKED: 'alignment-assets-faqs-clear-search-clicked',

    // Past Round Page
    PAST_ROUND_HERO_BTN_CLICKED: 'alignment-assets-past-round-hero-btn-clicked',
    PAST_LEADERBOARD_SHOW_MORE_CLICKED: 'alignment-assets-past-leaderboard-show-more-clicked',

    // Scroll Depth Tracking
    SCROLL_DEPTH_50: 'alignment-assets-scroll-depth-50',
    SCROLL_DEPTH_70: 'alignment-assets-scroll-depth-70',
    SCROLL_DEPTH_90: 'alignment-assets-scroll-depth-90',
  };

  // ==========================================
  // Navigation & Menu Analytics
  // ==========================================
  function onNavMenuClicked(menuName: string, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.NAV_MENU_CLICKED, { menuName, url });
  }

  function onBackButtonClicked(pageTitle: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.BACK_BUTTON_CLICKED, { pageTitle });
  }

  function onRoundSelectorOpened(currentRound: number, viewingRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ROUND_SELECTOR_OPENED, { currentRound, viewingRound });
  }

  function onRoundSelectorPrevClicked(fromRound: number, toRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ROUND_SELECTOR_PREV_CLICKED, { fromRound, toRound });
  }

  function onRoundSelectorNextClicked(fromRound: number, toRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ROUND_SELECTOR_NEXT_CLICKED, { fromRound, toRound });
  }

  function onRoundSelectorGoToCurrentClicked(fromRound: number, currentRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ROUND_SELECTOR_GO_TO_CURRENT_CLICKED, { fromRound, currentRound });
  }

  // ==========================================
  // Overview Page Analytics
  // ==========================================
  function onOverviewCreateAccountClicked(buttonPosition: 'start' | 'floating' | 'end') {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.OVERVIEW_CREATE_ACCOUNT_CLICKED, { buttonPosition });
  }

  function onOverviewWaitlistFormClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.OVERVIEW_WAITLIST_FORM_CLICKED, { url });
  }

  function onOverviewLearnMoreClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.OVERVIEW_LEARN_MORE_CLICKED, { url });
  }

  function onOverviewFaqLinkClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.OVERVIEW_FAQ_LINK_CLICKED, { url });
  }

  // ==========================================
  // Incentive Model Page Analytics
  // ==========================================
  function onIncentiveModelActivitiesLinkClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_ACTIVITIES_LINK_CLICKED, { url });
  }

  function onIncentiveModelRoundDropdownOpened(currentRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_ROUND_DROPDOWN_OPENED, { currentRound });
  }

  function onIncentiveModelPrevRoundClicked(fromRound: number, toRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_PREV_ROUND_CLICKED, { fromRound, toRound });
  }

  function onIncentiveModelNextRoundClicked(fromRound: number, toRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_NEXT_ROUND_CLICKED, { fromRound, toRound });
  }

  function onIncentiveModelGoToCurrentClicked(fromRound: number, currentRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_GO_TO_CURRENT_CLICKED, { fromRound, currentRound });
  }

  function onIncentiveModelRoundInputChanged(newRound: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_ROUND_INPUT_CHANGED, { newRound });
  }

  function onIncentiveModelTipViewLinkClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_TIP_VIEW_LINK_CLICKED, { url });
  }

  function onIncentiveModelLearnMoreClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.INCENTIVE_MODEL_LEARN_MORE_CLICKED, { url });
  }

  // ==========================================
  // Activities Page Analytics
  // ==========================================
  function onActivitiesSubmitBtnClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_SUBMIT_BTN_CLICKED, { url });
  }

  function onActivitiesSuggestLinkClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_SUGGEST_LINK_CLICKED, { url });
  }

  function onActivitiesRowClicked(activity: IActivityAnalyticsParams) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_ROW_CLICKED, {
      activityId: activity.activityId,
      activityName: activity.activityName,
      category: activity.category,
      points: activity.points,
    });
  }

  function onActivitiesFormLinkClicked(activity: IActivityAnalyticsParams, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_FORM_LINK_CLICKED, {
      activityId: activity.activityId,
      activityName: activity.activityName,
      category: activity.category,
      url,
    });
  }

  function onActivitiesModalClosed(activity: IActivityAnalyticsParams) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_MODAL_CLOSED, {
      activityId: activity.activityId,
      activityName: activity.activityName,
    });
  }

  function onActivitiesModalLinkClicked(activity: IActivityAnalyticsParams, linkText: string, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ACTIVITIES_MODAL_LINK_CLICKED, {
      activityId: activity.activityId,
      activityName: activity.activityName,
      linkText,
      url,
    });
  }

  // ==========================================
  // Rounds Page Analytics
  // ==========================================
  function onRoundsHeroBtnClicked(buttonType: 'primary' | 'secondary', buttonLabel: string, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.ROUNDS_HERO_BTN_CLICKED, { buttonType, buttonLabel, url });
  }

  // ==========================================
  // Snapshot Progress Section Analytics
  // ==========================================
  function onSnapshotTipLinkClicked(linkText: string, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SNAPSHOT_TIP_LINK_CLICKED, { linkText, url });
  }

  // ==========================================
  // Leaderboard Section Analytics
  // ==========================================
  function onLeaderboardViewToggleClicked(view: 'current' | 'alltime') {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.LEADERBOARD_VIEW_TOGGLE_CLICKED, { view });
  }

  function onLeaderboardSearchUsed(searchTerm: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.LEADERBOARD_SEARCH_USED, { searchTerm });
  }

  function onLeaderboardShowMoreClicked(currentCount: number, remainingCount: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.LEADERBOARD_SHOW_MORE_CLICKED, { currentCount, remainingCount });
  }

  // ==========================================
  // Buyback Auction Section Analytics
  // ==========================================
  function onBuybackShowMoreClicked(currentCount: number, remainingCount: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.BUYBACK_SHOW_MORE_CLICKED, { currentCount, remainingCount });
  }

  // ==========================================
  // Learn More Section Analytics
  // ==========================================
  function onLearnMoreFaqClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.LEARN_MORE_FAQ_CLICKED, { url });
  }

  // ==========================================
  // Support Section Analytics
  // ==========================================
  function onSupportOfficeHoursClicked(url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SUPPORT_OFFICE_HOURS_CLICKED, { url });
  }

  function onSupportEmailClicked(email: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SUPPORT_EMAIL_CLICKED, { email });
  }

  // ==========================================
  // FAQs Page Analytics
  // ==========================================
  function onFaqsSearchUsed(searchQuery: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.FAQS_SEARCH_USED, { searchQuery });
  }

  function onFaqsExpandAllClicked(isExpanded: boolean) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.FAQS_EXPAND_ALL_CLICKED, { isExpanded });
  }

  function onFaqsQuestionToggled(categoryId: string, questionId: string, questionText: string, isExpanded: boolean) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.FAQS_QUESTION_TOGGLED, { categoryId, questionId, questionText, isExpanded });
  }

  function onFaqsClearSearchClicked(previousSearchQuery: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.FAQS_CLEAR_SEARCH_CLICKED, { previousSearchQuery });
  }

  // ==========================================
  // Past Round Page Analytics
  // ==========================================
  function onPastRoundHeroBtnClicked(roundNumber: number, buttonLabel: string, url: string) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.PAST_ROUND_HERO_BTN_CLICKED, { roundNumber, buttonLabel, url });
  }

  function onPastLeaderboardShowMoreClicked(roundNumber: number, currentCount: number) {
    captureEvent(ALIGNMENT_ASSETS_ANALYTICS_EVENTS.PAST_LEADERBOARD_SHOW_MORE_CLICKED, { roundNumber, currentCount });
  }

  // ==========================================
  // Scroll Depth Tracking Analytics
  // ==========================================
  function onScrollDepth(pageName: string, depth: 50 | 70 | 90) {
    const eventMap: Record<50 | 70 | 90, string> = {
      50: ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SCROLL_DEPTH_50,
      70: ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SCROLL_DEPTH_70,
      90: ALIGNMENT_ASSETS_ANALYTICS_EVENTS.SCROLL_DEPTH_90,
    };
    captureEvent(eventMap[depth], { pageName, scrollDepth: `${depth}%` });
  }

  return {
    // Navigation & Menu
    onNavMenuClicked,
    onBackButtonClicked,
    onRoundSelectorOpened,
    onRoundSelectorPrevClicked,
    onRoundSelectorNextClicked,
    onRoundSelectorGoToCurrentClicked,

    // Overview Page
    onOverviewCreateAccountClicked,
    onOverviewWaitlistFormClicked,
    onOverviewLearnMoreClicked,
    onOverviewFaqLinkClicked,

    // Incentive Model Page
    onIncentiveModelActivitiesLinkClicked,
    onIncentiveModelRoundDropdownOpened,
    onIncentiveModelPrevRoundClicked,
    onIncentiveModelNextRoundClicked,
    onIncentiveModelGoToCurrentClicked,
    onIncentiveModelRoundInputChanged,
    onIncentiveModelTipViewLinkClicked,
    onIncentiveModelLearnMoreClicked,

    // Activities Page
    onActivitiesSubmitBtnClicked,
    onActivitiesSuggestLinkClicked,
    onActivitiesRowClicked,
    onActivitiesFormLinkClicked,
    onActivitiesModalClosed,
    onActivitiesModalLinkClicked,

    // Rounds Page
    onRoundsHeroBtnClicked,

    // Snapshot Progress Section
    onSnapshotTipLinkClicked,

    // Leaderboard Section
    onLeaderboardViewToggleClicked,
    onLeaderboardSearchUsed,
    onLeaderboardShowMoreClicked,

    // Buyback Auction Section
    onBuybackShowMoreClicked,

    // Learn More Section
    onLearnMoreFaqClicked,

    // Support Section
    onSupportOfficeHoursClicked,
    onSupportEmailClicked,

    // FAQs Page
    onFaqsSearchUsed,
    onFaqsExpandAllClicked,
    onFaqsQuestionToggled,
    onFaqsClearSearchClicked,

    // Past Round Page
    onPastRoundHeroBtnClicked,
    onPastLeaderboardShowMoreClicked,

    // Scroll Depth Tracking
    onScrollDepth,
  };
};
