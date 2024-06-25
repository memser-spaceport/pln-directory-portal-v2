import { IAnalyticsUserInfo } from "@/types/shared.types";
import { COMMON_ANALYTICS_EVENTS } from "@/utils/constants";
import { usePostHog } from "posthog-js/react";


export const useCommonAnalytics = () => {
    const postHogProps = usePostHog();


    const captureEvent = (eventName: string, eventParams = {}) => {
        try {
          if (postHogProps?.capture) {
            const allParams = { ...eventParams };
            postHogProps.capture(eventName, { ...allParams });
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

      function onNavAccountItemClicked(name: string, user: IAnalyticsUserInfo | null) {
        const params = {
            name,
            user,
        }
        captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_ACCOUNTMENU_ITEM_CLICKED, params);
      }

      function onNavJoinNetworkClicked(status: boolean) {
        const params = {
            status,
        }
        captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_JOIN_NETWORK_CLICKED, params )
      }
      
      function onNavJoinNetworkOptionClicked(option: string) {
        const params = {
            option,
        }
        captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_JOIN_NETWORK_OPTION_CLICKED, params )
      }

      function onNavDrawerBtnClicked(status: boolean) {
        const params = {
            status,
        }
        captureEvent(COMMON_ANALYTICS_EVENTS.NAVBAR_DRAWER_BTN_CLICKED, params )
      }

      function onPaginationOptionClicked(option: string, page: number, user: IAnalyticsUserInfo | null, from: string) {
        const params = {
          option,
          page,
          user,
          from
        }

        captureEvent(COMMON_ANALYTICS_EVENTS.FOOTER_PAGINATION_OPTION_CLICKED, params)
      }

      return {
        onNavItemClicked,
        onNavGetHelpItemClicked,
        onNavAccountItemClicked,
        onNavJoinNetworkClicked,
        onNavJoinNetworkOptionClicked,
        onNavDrawerBtnClicked, 
        onPaginationOptionClicked

      }
}