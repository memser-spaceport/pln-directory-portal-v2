import { UNIFIED_SEARCH_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import { ForumFoundItem, FoundItem } from '@/services/search/types';

/** Where a member asked an AI search question. */
export type AiQueryEntryPoint = 'header-dialog' | 'ai-search-page' | 'home';
/** How the question was submitted. */
export type AiQuerySubmitType = 'user-input' | 'prompt' | 'followup' | 'regenerate';

const AI_QUERY_MAX_LENGTH = 500;

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

  /** The member-side ask: one event per accepted AI search submit, sent before the answer arrives. */
  function onAiQuerySubmitted(query: string, entryPoint: AiQueryEntryPoint, submitType: AiQuerySubmitType) {
    const searchValue = query.trim().slice(0, AI_QUERY_MAX_LENGTH);
    if (!searchValue) {
      return;
    }
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.AI_QUERY_SUBMITTED, { searchValue, entryPoint, submitType });
  }

  /** One event per full search whose text looks like an email. It never carries the search text. */
  function onEmailQuerySubmitted() {
    captureEvent(UNIFIED_SEARCH_ANALYTICS_EVENTS.EMAIL_QUERY_SUBMITTED, {});
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
    onAiQuerySubmitted,
    onEmailQuerySubmitted,
  };
};
