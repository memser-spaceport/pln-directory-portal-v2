export enum SearchQueryKeys {
  GET_APPLICATION_SEARCH_RESULTS = 'GET_APPLICATION_SEARCH_RESULTS',
  GET_FULL_APPLICATION_SEARCH_RESULTS = 'GET_FULL_APPLICATION_SEARCH_RESULTS',
  GET_RECENT_SEARCH = 'GET_RECENT_SEARCH',
  GET_AI_CHAT_HISTORY = 'GET_AI_CHAT_HISTORY',
  AUTHOR_SEARCH = 'AUTHOR_SEARCH',
}

/**
 * Prompts phrased as things to find in the directory, each with its per-type
 * glyph. The old three asked the product about itself ("How does the Husky AI
 * work") — which teaches that AI Search answers questions about the site
 * rather than about the network the site is a directory of.
 */
export const AI_SEARCH_SUGGESTIONS: { text: string; icon: string }[] = [
  { text: 'Find teams building on Filecoin in Berlin', icon: '/icons/husky/husky-team.svg' },
  { text: 'Who works on zero-knowledge proofs and offers office hours?', icon: '/icons/husky/husky-member.svg' },
  { text: 'Which events in Lisbon have PL members attending?', icon: '/icons/husky/husky-event.svg' },
];
