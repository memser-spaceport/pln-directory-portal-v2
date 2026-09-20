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

/**
 * The header search rebuilt as one dialog (LAB-2477, plus #3010/#3015/#3019/#3020).
 *
 * Off — unset, or anything other than 'true' — mounts the search that preceded
 * it, `LegacyApplicationSearch`. That is the default and what ships, so the
 * rollback is the absence of configuration rather than an env var someone has
 * to set under pressure.
 *
 * Inlined at build time: changing it needs a redeploy, not just a restart. In
 * local development it is read when the dev server boots, so a change to
 * .env.local needs that server restarted.
 *
 * DELETE WITH: the legacy header search, once the dialog is promoted.
 */
export const SHOW_AI_SEARCH_DIALOG: boolean = process.env.NEXT_PUBLIC_SHOW_AI_SEARCH_DIALOG === 'true';

/**
 * Shortest term worth searching for, or worth remembering under Recent.
 *
 * Shared so the two header searches cannot disagree about what counts as a
 * search — they write to the same three-item list, and a floor that differed
 * between them would show up as entries one UI can produce and the other
 * cannot. Below this the dialog's AI row would also be offering to chat about a
 * stray character.
 */
export const MIN_ASK_LENGTH = 2;
