'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

import { useMcpAnalytics } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { ClientLogo, clientKeyFromName } from '@/components/page/settings/mcp/ClientLogo';
import { CopyButton } from '@/components/ui/CopyButton';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import { MCP_HINT_COMMENTS_FLAG, MCP_HINT_FORUM_FLAG, MCP_HINT_SEARCH_FLAG } from '@/utils/mcp';

import { getAiSearchCount } from './aiSearchSessionCount';
import { useMcpHintAudience } from './useMcpHintAudience';

import s from './McpHint.module.scss';

/** What the member just asked, typed or received in the host; the hint quotes it. */
export type McpHintProps =
  | { context: 'search'; query: string }
  | { context: 'forum'; title: string }
  | { context: 'comments'; newCount: number };

type HintCopy = {
  /** The host's trigger: the member just did something an agent could do for them. */
  triggered: boolean;
  /** Not connected: what connecting would give them. */
  title: string;
  text: string;
  /** Connected: the same request as a prompt for their agent. */
  prompt: string;
  /** The spacing the hint takes in its host. */
  hostClass: string;
};

const FLAG: Record<McpHintProps['context'], string> = {
  search: MCP_HINT_SEARCH_FLAG,
  forum: MCP_HINT_FORUM_FLAG,
  comments: MCP_HINT_COMMENTS_FLAG,
};

/** Copy ported verbatim from the LAB-2948 prototype's `CONTEXTS` (McpHints.tsx). */
function hintCopy(props: McpHintProps): HintCopy {
  switch (props.context) {
    case 'search':
      return {
        // From the second search in a browser session.
        triggered: !!props.query.trim() && getAiSearchCount() >= 2,
        title: 'Ask this from Claude or Codex next time',
        text: `Connect LabOS to your agent and search “${props.query}” where you already work.`,
        prompt: `Search LabOS for ${props.query.toLowerCase()}`,
        hostClass: s.hostHintAboveInput,
      };
    case 'forum':
      return {
        triggered: !!props.title.trim(),
        title: 'Let your agent draft this post',
        text: 'It reads similar threads and drafts the post for you to review here.',
        prompt: `Draft a LabOS forum post titled “${props.title}”`,
        hostClass: s.hostHint,
      };
    case 'comments':
      return {
        triggered: props.newCount >= 3,
        title: `Triage these ${props.newCount} new comments from your agent`,
        text: 'It reads new feedback on your apps and marks it done as you fix it.',
        prompt: 'Go through the new LabOS feedback on my apps and mark what I fix as done',
        hostClass: s.hostHintWide,
      };
  }
}

/**
 * A contextual MCP hint (LAB-3033), ported from the LAB-2948 prototype's `McpHint`. Said right after the member did
 * something an agent could have done for them, quoting it. Members without an agent get "Connect an agent"; members
 * with one get the same request as a prompt to copy. Shown only to the MCP hint audience; dismissed once, it stays
 * gone for that context. Renders nothing (not even its spacing) while hidden, so hosts can mount it unconditionally.
 */
export function McpHint(props: McpHintProps) {
  const { context } = props;
  const router = useRouter();
  const analytics = useMcpAnalytics();
  const { ready, connected, connectedClient } = useMcpHintAudience();
  // LAB-3049: a client that sent no name is "your agent", with the brand-free plug mark.
  const agentName = connectedClient ?? 'your agent';
  const flag = useOneTimeCallout(FLAG[context]);
  const copy = hintCopy(props);

  const visible = ready && flag.open && copy.triggered;

  const reported = useRef(false);
  useEffect(() => {
    if (!visible || reported.current) return;
    reported.current = true;
    analytics.onHintShown({ context, connected });
  }, [visible, analytics, context, connected]);

  if (!visible) return null;

  return (
    <div className={copy.hostClass}>
      <div className={s.hint} role="note">
        <span className={s.hintMarks} aria-hidden>
          {connected ? (
            <ClientLogo client={connectedClient ? clientKeyFromName(connectedClient) : 'other'} />
          ) : (
            <>
              <ClientLogo client="claude-code" />
              <ClientLogo client="codex" />
            </>
          )}
        </span>
        {connected ? (
          <div className={s.hintBody}>
            <span className={s.label}>Ask {agentName} instead</span>
            <div className={s.hintPrompt}>
              <span className={s.hintPromptText}>{copy.prompt}</span>
              <CopyButton
                text={copy.prompt}
                onCopy={() => analytics.onHintPromptCopied({ context, clientName: connectedClient ?? undefined })}
              />
            </div>
          </div>
        ) : (
          <div className={s.hintBody}>
            <span className={s.label}>{copy.title}</span>
            <span className={s.help}>{copy.text}</span>
            <Button
              size="s"
              style="link"
              className={s.linkBtn}
              onClick={() => {
                analytics.onHintConnectClicked({ context });
                router.push('/settings/mcp');
              }}
            >
              Connect an agent
            </Button>
          </div>
        )}
        <button
          type="button"
          className={clsx(s.iconBtn, s.hintClose)}
          aria-label="Dismiss"
          onClick={() => {
            analytics.onHintDismissed({ context });
            flag.dismiss();
          }}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
