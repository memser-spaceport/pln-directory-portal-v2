'use client';

import { useMemo } from 'react';

import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { CopyButton } from '@/components/ui/CopyButton';
import mcp from '@/components/page/connected-accounts/McpSection.module.scss';

/**
 * How to connect: the server URL and the developer commands, as in Email & Accounts' MCP card.
 * TODO(LAB-2997 task 3.1): once LAB-2993 (#3366) lands, McpSection and this page share one guide with its Claude app
 * steps first.
 */
export function McpConnectGuide() {
  const analytics = useMcpAnalytics();
  const serverUrl = `${process.env.DIRECTORY_API_URL}/mcp`;
  const claudeSnippet = useMemo(() => `claude mcp add --transport http labos ${serverUrl}`, [serverUrl]);
  const codexSnippet = useMemo(() => `codex mcp add labos --url ${serverUrl}\ncodex mcp login labos`, [serverUrl]);

  return (
    <div>
      <div className={mcp.row}>
        <div>
          <div className={mcp.label}>MCP server URL</div>
          <code className={mcp.code}>{serverUrl}</code>
        </div>
        <CopyButton text={serverUrl} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'server' })} />
      </div>
      <div className={mcp.row}>
        <div>
          <div className={mcp.label}>Claude Code</div>
          <code className={mcp.code}>{claudeSnippet}</code>
        </div>
        <CopyButton text={claudeSnippet} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'claude' })} />
      </div>
      <div className={mcp.row}>
        <div>
          <div className={mcp.label}>Codex</div>
          <code className={mcp.code}>{codexSnippet}</code>
        </div>
        <CopyButton text={codexSnippet} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'codex' })} />
      </div>
    </div>
  );
}
