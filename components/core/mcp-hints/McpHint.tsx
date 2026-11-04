'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

import { type McpAppsHintState, useMcpAnalytics } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { ClientLogo, clientKeyFromName } from '@/components/page/settings/mcp/ClientLogo';
import { CopyButton } from '@/components/ui/CopyButton';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';
import type { McpLevel } from '@/services/mcp/types';
import { MCP_HINT_APPS_FLAG, MCP_HINT_COMMENTS_FLAG, MCP_HINT_FORUM_FLAG, MCP_HINT_SEARCH_FLAG } from '@/utils/mcp';

import { getAiSearchCount } from './aiSearchSessionCount';
import { type McpHintAudience, useMcpHintAudience } from './useMcpHintAudience';

import s from './McpHint.module.scss';

/** What the member just asked, typed or received in the host; the hint quotes it. */
export type McpHintProps =
  | { context: 'search'; query: string }
  | { context: 'forum'; title: string }
  | { context: 'comments'; newCount: number }
  | {
      context: 'apps';
      /**
       * The member's own most recently updated app (LAB-3136): null when they created none, undefined while the apps
       * list is still loading (the hint waits, so it never shows the wrong state).
       */
      latestAppName: string | null | undefined;
      /** Opens the Starter Kit flow of the Create AI App card (`CreateAiAppModal`). */
      onGetStarterKit: () => void;
    };

/** Where a hint's link goes: Settings → MCP connections, that connection's permissions, or the Starter Kit. */
type HintLinkTo = 'connect' | 'permissions' | 'starter-kit';

type HintCopy = {
  /** The host's trigger: the member just did something an agent could do for them. */
  triggered: boolean;
  /** Not connected: what connecting would give them. */
  title: string;
  text: string;
  /** Connected: the same request as a prompt for their agent. None means the hint shows `links` instead. */
  prompt?: string;
  /** Connected with a prompt: replaces "Ask <agent> instead" and says where the prompt goes. */
  connectedTitle?: string;
  connectedText?: string;
  /** The links when there is no prompt to copy. Defaults to "Connect an agent". */
  links?: { label: string; to: HintLinkTo }[];
  /** AI Apps page only: which of its states this is, for `mcp-hint-shown`. */
  appsState?: McpAppsHintState;
  /** The spacing the hint takes in its host. */
  hostClass: string;
};

const FLAG: Record<McpHintProps['context'], string> = {
  search: MCP_HINT_SEARCH_FLAG,
  forum: MCP_HINT_FORUM_FLAG,
  comments: MCP_HINT_COMMENTS_FLAG,
  apps: MCP_HINT_APPS_FLAG,
};

const CONNECT_LINK = { label: 'Connect an agent', to: 'connect' } as const;
const STARTER_KIT_LINK = { label: 'Get the Starter Kit', to: 'starter-kit' } as const;

/**
 * AI Apps page copy (LAB-3136), ported verbatim from the LAB-2948 prototype's `appsContext()` (rewritten 2026-11-03).
 * No app of their own: nothing for the agent to manage, and its tools cannot create one, so the Starter Kit. A connection
 * whose `ai_apps` access is below write (every first connect is Read only) would refuse a redeploy, so it asks to allow
 * changes instead of a prompt that fails.
 */
function appsHintCopy(
  agent: string,
  connected: boolean,
  aiAppsLevel: McpLevel | null,
  latestAppName: string | null,
): Omit<HintCopy, 'triggered' | 'hostClass'> {
  if (!latestAppName) {
    return connected
      ? {
          appsState: 'no_apps',
          title: `Build your first app with ${agent}`,
          text: `${agent} is connected to LabOS. Get the Starter Kit, open it in ${agent} and ask it to build and deploy your app. Once it’s live, ${agent} can redeploy it for you.`,
          links: [STARTER_KIT_LINK],
        }
      : {
          appsState: 'no_apps',
          title: 'Build your first app with Claude or Codex',
          text: 'Get the Starter Kit, open it in your agent and ask it to build and deploy the app. Connect your agent to LabOS too, and it can redeploy the app later.',
          links: [STARTER_KIT_LINK, CONNECT_LINK],
        };
  }
  if (!connected) {
    return {
      appsState: 'no_agent',
      title: 'Redeploy your apps from Claude or Codex',
      text: `Connect LabOS to your agent, then ask it to redeploy “${latestAppName}” from the chat you already work in.`,
      links: [CONNECT_LINK],
    };
  }
  if (aiAppsLevel !== 'write') {
    return {
      appsState: 'read_only',
      title: `Let ${agent} redeploy your apps`,
      text: `${agent} is connected with read-only access, so it can see your apps but not change them. Allow changes to AI Apps to redeploy and rename them from your chat.`,
      links: [{ label: 'Allow changes', to: 'permissions' }],
    };
  }
  return {
    appsState: 'connected',
    title: '',
    text: '',
    connectedTitle: `Redeploy your apps from ${agent}`,
    connectedText: `${agent} is connected to LabOS. Paste this into a ${agent} chat and it redeploys the app for you. It can rename apps and edit their descriptions the same way.`,
    prompt: `Redeploy my LabOS AI App “${latestAppName}”`,
  };
}

/** Copy ported verbatim from the LAB-2948 prototype's `CONTEXTS` (McpHints.tsx). */
function hintCopy(props: McpHintProps, audience: McpHintAudience, agentName: string): HintCopy {
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
    case 'apps':
      // LAB-3062: no member action to wait for; the AI Apps page itself is the moment. Shown until dismissed, once the
      // member's apps have loaded (LAB-3136: the copy depends on them).
      return {
        triggered: props.latestAppName !== undefined,
        ...appsHintCopy(agentName, audience.connected, audience.aiAppsLevel, props.latestAppName ?? null),
        hostClass: s.hostHintApps,
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
  const audience = useMcpHintAudience();
  const { ready, connected, connectedClient, connectionUid } = audience;
  // LAB-3049: a client that sent no name is "your agent", with the brand-free plug mark.
  const agentName = connectedClient ?? 'your agent';
  const flag = useOneTimeCallout(FLAG[context]);
  const copy = hintCopy(props, audience, agentName);
  const { appsState } = copy;

  const visible = ready && flag.open && copy.triggered;

  const reported = useRef(false);
  useEffect(() => {
    if (!visible || reported.current) return;
    reported.current = true;
    analytics.onHintShown(appsState ? { context, connected, state: appsState } : { context, connected });
  }, [visible, analytics, context, connected, appsState]);

  if (!visible) return null;

  const showPrompt = connected && !!copy.prompt;
  const links = copy.links ?? [CONNECT_LINK];
  const onLink = (to: HintLinkTo) => {
    if (to === 'starter-kit' && props.context === 'apps') {
      analytics.onHintStarterKitClicked({ context, state: appsState ?? 'no_apps' });
      props.onGetStarterKit();
    } else if (to === 'permissions' && connectionUid) {
      analytics.onHintAllowChangesClicked({
        context,
        authorizationUid: connectionUid,
        clientName: connectedClient ?? undefined,
      });
      router.push(`/settings/mcp?connection=${encodeURIComponent(connectionUid)}&scope=ai_apps`);
    } else {
      analytics.onHintConnectClicked({ context });
      router.push('/settings/mcp');
    }
  };

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
        {showPrompt && copy.prompt ? (
          <div className={s.hintBody}>
            <span className={s.label}>{copy.connectedTitle ?? `Ask ${agentName} instead`}</span>
            {copy.connectedText && <span className={s.help}>{copy.connectedText}</span>}
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
            <span className={s.hintLinks}>
              {links.map((link) => (
                <Button key={link.to} size="s" style="link" className={s.linkBtn} onClick={() => onLink(link.to)}>
                  {link.label}
                </Button>
              ))}
            </span>
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
