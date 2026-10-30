/** Settings → MCP connections, its own page at /settings/mcp (LAB-2995). Off: MCP stays in Email & Accounts. */
export const SHOW_MCP_CONNECTIONS_PAGE: boolean = process.env.NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE === 'true';

/** One-time flag: the "New" badge on Settings → MCP connections stays until the member opens the page. */
export const MCP_CONNECTIONS_NEW_FLAG = 'mcp_connections_new';

/** One-time flag: the site-wide MCP launch bar stays until the member closes it (LAB-3033). */
export const MCP_LAUNCH_BAR_FLAG = 'mcp_launch_bar';

/** One-time flags: each contextual MCP hint stays until the member dismisses it, per context (LAB-3033). */
export const MCP_HINT_SEARCH_FLAG = 'mcp_hint_search';
export const MCP_HINT_FORUM_FLAG = 'mcp_hint_forum';
export const MCP_HINT_COMMENTS_FLAG = 'mcp_hint_comments';
export const MCP_HINT_APPS_FLAG = 'mcp_hint_apps';

/**
 * The Forum → Create Post hint promises that an agent drafts the post, which needs Forum write tools (LAB-3031, NodeBB
 * auth). Off until they ship (LAB-3049); the `forum` context and its flag stay.
 */
export const SHOW_MCP_FORUM_HINT = false;
