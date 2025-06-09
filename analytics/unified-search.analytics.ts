import { UNIFIED_SEARCH_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';
import { FoundItem } from '@/services/search/types';

export const useUnifiedSearchAnalytics = () => {
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

  function onAutocompleteSearch(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.AUTOCOMPLETE_SEARCH, { searchValue });
  }

  function onFullSearch(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.FULL_SEARCH, { searchValue });
  }

  function onSearchResultClick(searchResult: FoundItem) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.SEARCH_RESULT_CLICK, { searchResult });
  }

  function onRecentSearchClick(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.RECENT_SEARCH_CLICK, { searchValue });
  }

  function onRecentSearchDeleteClick(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.RECENT_SEARCH_DELETE_CLICK, { searchValue });
  }

  function onFullSearchOpen() {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.FULL_SEARCH_OPEN, {});
  }

  function onAiConversationHistoryClick(threadTitle: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.AI_CONVERSATION_HISTORY_CLICK, { threadTitle });
  }

  function onAiConversationHistoryOpenClick() {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.AI_CONVERSATION_HISTORY_OPEN_CLICK, {});
  }

  return {
    onAutocompleteSearch,
    onFullSearch,
    onFullSearchOpen,
    onSearchResultClick,
    onRecentSearchClick,
    onRecentSearchDeleteClick,
    onAiConversationHistoryClick,
    onAiConversationHistoryOpenClick,
  };
};
