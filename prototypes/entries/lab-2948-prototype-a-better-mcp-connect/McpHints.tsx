'use client';

import { type ReactNode, useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CloseIcon } from '@/components/icons';

import { CreateAiAppModal } from '../ai-apps/CreateAiAppModal';
import { ClientLogo } from './ClientLogo';
import {
  AppsListHost,
  FeedbackHost,
  ForumPostHost,
  GENERAL_TERM,
  GeneralSearchHost,
  LATEST_APP,
  NEW_FEEDBACK,
  POST_TITLE,
  SEARCH_QUESTION,
  SearchHost,
} from './HintHosts';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

type HintKey = 'search' | 'general' | 'forum' | 'comments' | 'apps';

/** Where a hint's link goes: Settings → MCP connections, that connection's permissions, or the Starter Kit. */
type HintLinkTo = 'connect' | 'permissions' | 'starter-kit';

type HintContext = {
  key: HintKey;
  /** Review-band label for the host. */
  host: string;
  /** When the hint appears: after the member did the thing an agent could do for them. */
  trigger: string;
  /** Not connected: what connecting would give them, built from what they just did. */
  title: string;
  text: string;
  /** Connected: the prompt to run the same thing from their agent. None means the hint shows `links` instead. */
  prompt?: string;
  /** Connected with a prompt: replaces "Ask <agent> instead" and says where the prompt goes. */
  connectedTitle?: string;
  connectedText?: string;
  /** The links when there is no prompt to copy. Defaults to "Connect an agent". */
  links?: { label: string; to: HintLinkTo }[];
};

/** Member states on the AI Apps list: the AI Apps scope is write-only, and every first connect is Read only. */
type Member = 'none' | 'write' | 'read';

/**
 * AI Apps list hint (LAB-3062), rewritten 2026-11-03 after review: "Ask Claude Code
 * instead" + "Redeploy my latest LabOS AI App" didn't say where the prompt goes or
 * that the agent is already connected. The copy now follows two facts:
 * - Does the member have an app? No app → nothing for the MCP to manage, and it
 *   can't create one (the ai_apps scope is rename / redeploy / delete / access), so
 *   the hint points at the Starter Kit instead of a prompt.
 * - What can the connection do? Read only (every first connect) would refuse the
 *   redeploy, so it asks to allow changes instead of handing over a prompt that fails.
 */
function appsContext(agent: string | null, member: Member, hasApps: boolean): HintContext {
  const base = {
    key: 'apps' as const,
    host: 'AI Apps: list',
    trigger: 'Between the header and the grid, no trigger; copy follows whether the member has apps and the connection’s AI Apps access',
  };
  if (!hasApps) {
    return agent
      ? {
          ...base,
          title: `Build your first app with ${agent}`,
          text: `${agent} is connected to LabOS. Get the Starter Kit, open it in ${agent} and ask it to build and deploy your app. Once it’s live, ${agent} can redeploy it for you.`,
          links: [{ label: 'Get the Starter Kit', to: 'starter-kit' }],
        }
      : {
          ...base,
          title: 'Build your first app with Claude or Codex',
          text: 'Get the Starter Kit, open it in your agent and ask it to build and deploy the app. Connect your agent to LabOS too, and it can redeploy the app later.',
          links: [
            { label: 'Get the Starter Kit', to: 'starter-kit' },
            { label: 'Connect an agent', to: 'connect' },
          ],
        };
  }
  if (!agent) {
    return {
      ...base,
      title: 'Redeploy your apps from Claude or Codex',
      text: `Connect LabOS to your agent, then ask it to redeploy “${LATEST_APP}” from the chat you already work in.`,
    };
  }
  if (member === 'read') {
    return {
      ...base,
      title: `Let ${agent} redeploy your apps`,
      text: `${agent} is connected with read-only access, so it can see your apps but not change them. Allow changes to AI Apps to redeploy and rename them from your chat.`,
      links: [{ label: 'Allow changes', to: 'permissions' }],
    };
  }
  return {
    ...base,
    title: '',
    text: '',
    connectedTitle: `Redeploy your apps from ${agent}`,
    connectedText: `${agent} is connected to LabOS. Paste this into a ${agent} chat and it redeploys the app for you. It can rename apps and edit their descriptions the same way.`,
    prompt: `Redeploy my LabOS AI App “${LATEST_APP}”`,
  };
}

/**
 * One hint, said right after the member did something an agent could have
 * done for them, and quoting it: the search they ran, the post they are
 * starting, the feedback that came in. Members without an agent get "Connect
 * an agent"; members with one get the same request as a prompt to copy into
 * it. Dismissed once, it stays gone for that context, and every show, dismiss
 * and click is a PostHog event, so we learn which context works.
 */
const CONTEXTS: HintContext[] = [
  {
    key: 'search',
    host: 'AI Search',
    trigger: 'Above the follow-up field, from the second search in a session',
    title: 'Ask this from Claude or Codex next time',
    text: `Connect LabOS to your agent and search “${SEARCH_QUESTION}” where you already work.`,
    prompt: `Search LabOS for ${SEARCH_QUESTION.toLowerCase()}`,
  },
  {
    key: 'general',
    host: 'General search',
    trigger: 'Under the results in the header search, from the second search in a session',
    title: 'Look this up from Claude or Codex next time',
    text: `Connect LabOS to your agent and find who works on “${GENERAL_TERM}” where you already work.`,
    prompt: `Find LabOS members, teams and projects working on ${GENERAL_TERM}`,
  },
  {
    // 2026-10-27: on the new-post composer, not the reply box.
    key: 'forum',
    host: 'Forum: new post',
    trigger: 'Under the title, once the member has typed one',
    title: 'Let your agent draft this post',
    text: 'It reads similar threads and drafts the post for you to review here.',
    prompt: `Draft a LabOS forum post titled “${POST_TITLE}”`,
  },
  {
    key: 'comments',
    host: 'AI Apps: feedback',
    trigger: 'Under the tabs, when 3 or more new comments are waiting',
    title: `Triage these ${NEW_FEEDBACK.length} new comments from your agent`,
    text: 'It reads new feedback on your apps and marks it done as you fix it.',
    prompt: 'Go through the new LabOS feedback on my apps and mark what I fix as done',
  },
  appsContext(null, 'none', true),
];

export function McpHint({
  context,
  connectedAgent,
  onLink,
}: {
  context: HintContext;
  connectedAgent: string | null;
  onLink: (to: HintLinkTo) => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const showPrompt = !!connectedAgent && !!context.prompt;
  const links = context.links ?? [{ label: 'Connect an agent', to: 'connect' as const }];
  return (
    <div className={s.hint} role="note">
      <span className={s.hintMarks} aria-hidden>
        <ClientLogo client="claude-code" />
        {!connectedAgent && <ClientLogo client="codex" />}
      </span>
      {showPrompt ? (
        <div className={s.hintBody}>
          <span className={s.label}>{context.connectedTitle ?? `Ask ${connectedAgent} instead`}</span>
          {context.connectedText && <span className={s.help}>{context.connectedText}</span>}
          <div className={s.hintPrompt}>
            <span className={s.hintPromptText}>{context.prompt}</span>
            <CopyButton text={context.prompt!} />
          </div>
        </div>
      ) : (
        <div className={s.hintBody}>
          <span className={s.label}>{context.title}</span>
          <span className={s.help}>{context.text}</span>
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
        onClick={() => setHidden(true)}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/**
 * Review view: each hint in its full host page — AI Search with its answer,
 * Forum → New post, AI Apps → Feedback, AI Apps list — so the hint is judged where
 * it sits. The switches pick the host and the member's state; the AI Apps list adds
 * a read-only connection and a member with no apps of their own.
 */
export function McpHintsPreview({ onSetUp, onAllow }: { onSetUp: () => void; onAllow: () => void }) {
  const [key, setKey] = useState<HintKey>('search');
  const [member, setMember] = useState<Member>('none');
  const [hasApps, setHasApps] = useState(true);
  const [starterKitOpen, setStarterKitOpen] = useState(false);
  // Read only is an AI Apps state; the other hosts treat it as connected.
  const agent = member === 'none' ? null : 'Claude Code';
  const context = key === 'apps' ? appsContext(agent, member, hasApps) : CONTEXTS.find((item) => item.key === key)!;

  const onLink = (to: HintLinkTo) => {
    if (to === 'connect') onSetUp();
    else if (to === 'permissions') onAllow();
    else setStarterKitOpen(true);
  };

  const hint = (
    <McpHint key={`${key}-${member}-${hasApps}`} context={context} connectedAgent={agent} onLink={onLink} />
  );

  const hosts: Record<HintKey, ReactNode> = {
    search: <SearchHost hint={hint} />,
    general: <GeneralSearchHost hint={hint} />,
    forum: <ForumPostHost hint={hint} />,
    comments: <FeedbackHost hint={hint} />,
    apps: <AppsListHost hint={hint} hasApps={hasApps} onCreate={() => setStarterKitOpen(true)} />,
  };

  const members: [Member, string][] = [
    ['none', 'No agent yet'],
    ['write', 'Claude Code connected'],
    ...(key === 'apps' ? ([['read', 'Claude Code, read only']] as [Member, string][]) : []),
  ];

  return (
    <>
      <div className={s.hintSwitches}>
        <div className={s.segmented} role="radiogroup" aria-label="Where">
          {CONTEXTS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={key === item.key}
              className={clsx(s.segment, { [s.segmentActive]: key === item.key })}
              onClick={() => {
                setKey(item.key);
                if (item.key !== 'apps' && member === 'read') setMember('write');
                // A new host starts at the top (the body scrolls in portal-v2, not the document).
                document.body.scrollTo({ top: 0 });
                window.scrollTo({ top: 0 });
              }}
            >
              {item.host}
            </button>
          ))}
        </div>
        <div className={s.segmented} role="radiogroup" aria-label="Member">
          {members.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={member === value}
              className={clsx(s.segment, { [s.segmentActive]: member === value })}
              onClick={() => setMember(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {key === 'apps' && (
          <div className={s.segmented} role="radiogroup" aria-label="Member's apps">
            {(
              [
                [true, 'Has apps'],
                [false, 'No apps yet'],
              ] as [boolean, string][]
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={hasApps === value}
                className={clsx(s.segment, { [s.segmentActive]: hasApps === value })}
                onClick={() => setHasApps(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <span className={s.meta}>{context.trigger}</span>
        <BackendTag>Needs PostHog MCP events: shown, dismissed, connected, prompt copied</BackendTag>
        {key === 'apps' && (
          <BackendTag>Needs the member’s app count + latest app name, and the connection’s AI Apps access</BackendTag>
        )}
      </div>
      <div key={key}>{hosts[key]}</div>
      <CreateAiAppModal isOpen={starterKitOpen} onClose={() => setStarterKitOpen(false)} />
    </>
  );
}
