'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { fetchMcpAuthorizations, revokeMcpAuthorization } from '@/services/mcp/mcp.service';

import s from './McpSection.module.scss';

function formatDate(value: string | null) {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function McpSection() {
  const queryClient = useQueryClient();
  const analytics = useMcpAnalytics();
  const serverUrl = `${process.env.DIRECTORY_API_URL}/mcp`;
  const [revokingUid, setRevokingUid] = useState<string | null>(null);
  const trackedViewRef = useRef(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['mcp-authorizations'],
    queryFn: fetchMcpAuthorizations,
  });

  const claudeSnippet = useMemo(() => `claude mcp add --transport http labos ${serverUrl}`, [serverUrl]);
  const codexSnippet = useMemo(() => `codex mcp add labos --url ${serverUrl}\ncodex mcp login labos`, [serverUrl]);

  useEffect(() => {
    if (isLoading || trackedViewRef.current) return;
    trackedViewRef.current = true;
    analytics.onSettingsSectionViewed({ connectedClientCount: clients.length });
  }, [isLoading, clients.length, analytics]);

  const onRevoke = useCallback(
    async (uid: string, clientName: string) => {
      setRevokingUid(uid);
      const ok = await revokeMcpAuthorization(uid);
      setRevokingUid(null);
      if (ok) {
        analytics.onAuthorizationRevoked({ authorizationUid: uid, clientName });
        await queryClient.invalidateQueries({ queryKey: ['mcp-authorizations'] });
      } else {
        analytics.onAuthorizationRevokeFailed({ authorizationUid: uid });
      }
    },
    [queryClient, analytics],
  );

  const connected = clients.length > 0;

  return (
    <section className={s.root}>
      <div className={s.header}>MCP</div>
      <div className={s.content}>
        <p className={s.desc}>Connect LabOS to the Claude app, Claude Code, Codex, or any HTTP MCP client.</p>

        <div className={s.block} role="region" aria-labelledby="mcp-claude-app-title">
          <div id="mcp-claude-app-title" className={s.blockTitle}>
            Claude app (web, desktop, mobile)
          </div>
          <ol className={s.steps}>
            <li>In Claude, open Settings → Connectors → Add custom connector.</li>
            <li>
              <div>Name it &quot;LabOS&quot; and paste the LabOS MCP server URL. Select Add, then Connect.</div>
              <div className={s.row}>
                <code className={s.code}>{serverUrl}</code>
                <CopyButton
                  text={serverUrl}
                  onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'claude-app' })}
                />
              </div>
            </li>
            <li>Sign in to LabOS and approve the access.</li>
          </ol>
          <p className={s.desc}>
            After this, LabOS works in Claude on web, desktop and mobile. If you do not see Add custom connector, ask
            your Claude workspace admin to add LabOS.
          </p>
        </div>

        <p className={s.note}>
          Your agent acts as you, with your LabOS access. You choose read-only or make-changes when you approve. You can
          revoke an agent here at any time.
        </p>

        <div className={s.block} role="region" aria-labelledby="mcp-developers-title">
          <div id="mcp-developers-title" className={s.blockTitle}>
            For developers
          </div>

          <div className={s.row}>
            <div className={s.rowText}>
              <div className={s.label}>MCP server URL</div>
              <code className={s.code}>{serverUrl}</code>
            </div>
            <CopyButton text={serverUrl} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'server' })} />
          </div>

          <div className={s.row}>
            <div className={s.rowText}>
              <div className={s.label}>Claude Code</div>
              <code className={s.code}>{claudeSnippet}</code>
            </div>
            <CopyButton text={claudeSnippet} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'claude' })} />
          </div>

          <div className={s.row}>
            <div className={s.rowText}>
              <div className={s.label}>Codex</div>
              <code className={s.code}>{codexSnippet}</code>
            </div>
            <CopyButton text={codexSnippet} onCopy={() => analytics.onSetupSnippetCopied({ snippetType: 'codex' })} />
          </div>
        </div>

        <div className={s.status}>Status: {isLoading ? 'Loading…' : connected ? 'Connected' : 'Not connected'}</div>

        {clients.length > 0 && (
          <ul className={s.list}>
            {clients.map((client) => (
              <li key={client.uid} className={s.item}>
                <div>
                  <div className={s.clientName}>{client.clientName}</div>
                  <div className={s.meta}>
                    Connected {formatDate(client.connectedAt)} · Last used {formatDate(client.lastUsedAt)}
                  </div>
                </div>
                <Button
                  size="s"
                  variant="error"
                  style="border"
                  disabled={revokingUid === client.uid}
                  onClick={() => onRevoke(client.uid, client.clientName)}
                >
                  {revokingUid === client.uid ? 'Revoking…' : 'Revoke'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
