import { IAnalyticsUserInfo } from '@/types/shared.types';
import { COMMON_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';

/** Which nav bar the Home entry was clicked in. Not a viewport claim — it is
 *  the component that handled the click, which is the thing we can actually
 *  observe. */
export type NavHomeSource = 'desktop-nav' | 'mobile-nav';

export const useCommonAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = useCurrentUserStore.getState().currentUser;
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onNavItemClicked(name: string, user: IAnalyticsUserInfo | null) {
    const params = {
      name,
      user,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_MENU_ITEM_CLICKED, params);
  }

  function onNavGetHelpItemClicked(name: string, user: IAnalyticsUserInfo | null) {
    const params = {
      name,
      user,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_GET_HELP_ITEM_CLICKED, params);
  }

  /** The header (?) was pressed — the help and feedback door being used.
   *
   *  The name says "menu" because the wire string does, and that string is not
   *  worth breaking: for one day the (?) opened a menu of topics, and the event
   *  predates and outlives it. What it counts is unchanged either way — someone
   *  went looking for help — and it is now the only signal that they did, since
   *  the form itself reports nothing. */
  function onHelpMenuOpened(user: IAnalyticsUserInfo | null) {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_HELP_MENU_OPENED, { user });
  }

  /** The one-time callout on the (?) was rendered. Paired with the dismissal
   *  the same way `onHomeNewNewsDotShown` is paired with its click. */
  function onHelpCalloutShown(user: IAnalyticsUserInfo | null) {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_HELP_CALLOUT_SHOWN, { user });
  }

  /** `via` separates "read it and acknowledged" from "opened the support form,
   *  which is what the callout was pointing at" — the second is the outcome the
   *  callout exists for, and they should not be counted as one thing.
   *  `escape` is neither: a keyboard dismissal that tells us nothing about
   *  whether the sentence landed.
   *
   *  `modal-opened` was `menu-opened` for the one day the (?) opened a menu. A
   *  property value rather than an event name, and a day old, so it was renamed
   *  rather than kept pointing at something that no longer exists. */
  function onHelpCalloutDismissed(via: 'got-it' | 'escape' | 'modal-opened', user: IAnalyticsUserInfo | null) {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_HELP_CALLOUT_DISMISSED, { via, user });
  }

  /** A topic pill in the support form was picked — separate from
   *  `onNavGetHelpItemClicked`, which already covers the menu item that opened
   *  the form on that topic. This is the in-form change, e.g. someone landed on
   *  "Contact support" via a deep link and switched to "Report a bug". */
  function onContactSupportTopicPillSelected(topic: string, user: IAnalyticsUserInfo | null) {
    captureEvent(COMMON_ANALYTICS_EVENTS.CONTACT_SUPPORT_TOPIC_PILL_SELECTED, { topic, user });
  }

  function onNavAccountItemClicked(name: string, user: IAnalyticsUserInfo | null) {
    const params = {
      name,
      user,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_ACCOUNTMENU_ITEM_CLICKED, params);
  }

  function onNavJoinNetworkClicked(status: boolean) {
    const params = {
      status,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_JOIN_NETWORK_CLICKED, params);
  }

  function onNavJoinNetworkOptionClicked(option: string) {
    const params = {
      option,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_JOIN_NETWORK_OPTION_CLICKED, params);
  }

  function onNavDrawerBtnClicked(status: boolean) {
    const params = {
      status,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_DRAWER_BTN_CLICKED, params);
  }

  function onPaginationOptionClicked(option: string, page: number, user: IAnalyticsUserInfo | null, from: string) {
    const params = {
      option,
      page,
      user,
      from,
    };

    captureEvent(COMMON_ANALYTICS_EVENTS.FOOTER_PAGINATION_OPTION_CLICKED, params);
  }

  function onSessionExpiredLoginClicked() {
    captureEvent(COMMON_ANALYTICS_EVENTS.SESSION_EXPIRED_POPUP_LOGIN_BTN_CLICKED);
  }

  function goToTopBtnClicked(user: IAnalyticsUserInfo | null, pageName: string) {
    const params = {
      user,
      pageName,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.GO_TO_TOP_BTN_CLICKED, params);
  }

  function onNotificationMenuClickHandler(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_NOTIFICATION_MENU_CLICKED, params);
  }

  function onAppLogoClicked() {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_APP_LOGO_CLICKED);
  }

  function onSubmitATeamBtnClicked() {
    captureEvent(COMMON_ANALYTICS_EVENTS.SUBMIT_A_TEAM_BTN_CLICKED);
  }

  /** Home's own click event, fired alongside the generic nav one rather than
   *  replacing it — the nav dashboards count every item through
   *  NAVBAR_MENU_ITEM_CLICKED, and bolting Home-only properties onto that
   *  shared event would make it mean two different things.
   *
   *  `hasNewNews` is read at click time, before /home clears it, so this is
   *  the only place the dot's pull is observable at all. */
  function onHomeNavClicked(source: NavHomeSource, hasNewNews: boolean) {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_HOME_CLICKED, { source, hasNewNews });
  }

  /** The denominator for the above: the dot rendered for this member on this
   *  page load. Deliberately carries no viewport — both navs stay mounted at
   *  every width and are hidden with CSS, so neither one can honestly claim
   *  it was the visible one. Fired from the desktop navbar only; firing from
   *  both would double every impression. */
  function onHomeNewNewsDotShown() {
    captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_HOME_NEW_NEWS_DOT_SHOWN);
  }

  return {
    onHomeNavClicked,
    onHomeNewNewsDotShown,
    onNavItemClicked,
    onNavGetHelpItemClicked,
    onHelpMenuOpened,
    onHelpCalloutShown,
    onHelpCalloutDismissed,
    onContactSupportTopicPillSelected,
    onNavAccountItemClicked,
    onNavJoinNetworkClicked,
    onNavJoinNetworkOptionClicked,
    onNavDrawerBtnClicked,
    onPaginationOptionClicked,
    onSessionExpiredLoginClicked,
    goToTopBtnClicked,
    onNotificationMenuClickHandler,
    onAppLogoClicked,
    onSubmitATeamBtnClicked,
  };
};
