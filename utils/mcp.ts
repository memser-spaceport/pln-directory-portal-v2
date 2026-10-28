/** Settings → MCP connections, its own page at /settings/mcp (LAB-2995). Off: MCP stays in Email & Accounts. */
export const SHOW_MCP_CONNECTIONS_PAGE: boolean = process.env.NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE === 'true';

/** One-time flag: the "New" badge on Settings → MCP connections stays until the member opens the page. */
export const MCP_CONNECTIONS_NEW_FLAG = 'mcp_connections_new';
