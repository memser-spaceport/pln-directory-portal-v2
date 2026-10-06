import { UNIFIED_SEARCH_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import { ForumFoundItem, FoundItem } from '@/services/search/types';

export const useUnifiedSearchAnalytics = () => {
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

  function onAutocompleteSearch(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.AUTOCOMPLETE_SEARCH, { searchValue });
  }

  function onFullSearch(searchValue: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.FULL_SEARCH, { searchValue });
  }

  function onSearchResultClick(searchResult: FoundItem | ForumFoundItem) {
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

  function onSharedChatContinued(sharedThreadId: string, copyThreadId: string) {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.SHARED_CHAT_CONTINUED, { sharedThreadId, copyThreadId });
  }

  function onSigninPromptClicked(action: 'sign-in' | 'sign-up') {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.SIGNIN_PROMPT_CLICKED, { action });
  }

  return {
    onAutocompleteSearch,
    onFullSearch,
    onFullSearchOpen,
    onSharedChatContinued,
    onSigninPromptClicked,
    onSearchResultClick,
    onRecentSearchClick,
    onRecentSearchDeleteClick,
    onAiConversationHistoryClick,
    onAiConversationHistoryOpenClick,
  };
};
