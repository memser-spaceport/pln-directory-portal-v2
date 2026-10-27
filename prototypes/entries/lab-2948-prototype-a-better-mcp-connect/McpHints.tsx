'use client';

import { type ReactNode, useState } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CloseIcon } from '@/components/icons';

import { ClientLogo } from './ClientLogo';
import { FeedbackHost, ForumPostHost, NEW_FEEDBACK, POST_TITLE, SEARCH_QUESTION, SearchHost } from './HintHosts';
import { BackendTag } from './shared';
import s from './McpSectionMock.module.scss';

type HintKey = 'search' | 'forum' | 'comments';

type HintContext = {
  key: HintKey;
  /** Review-band label for the host. */
  host: string;
  /** When the hint appears: after the member did the thing an agent could do for them. */
  trigger: string;
  /** Not connected: what connecting would give them, built from what they just did. */
  title: string;
  text: string;
  /** Connected: the prompt to run the same thing from their agent. */
  prompt: string;
};

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
];

export function McpHint({
  context,
  connectedAgent,
  onSetUp,
}: {
  context: HintContext;
  connectedAgent: string | null;
  onSetUp: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className={s.hint} role="note">
      <span className={s.hintMarks} aria-hidden>
        <ClientLogo client="claude-code" />
        {!connectedAgent && <ClientLogo client="codex" />}
      </span>
      {connectedAgent ? (
        <div className={s.hintBody}>
          <span className={s.label}>Ask {connectedAgent} instead</span>
          <div className={s.hintPrompt}>
            <span className={s.hintPromptText}>{context.prompt}</span>
            <CopyButton text={context.prompt} />
          </div>
        </div>
      ) : (
        <div className={s.hintBody}>
          <span className={s.label}>{context.title}</span>
          <span className={s.help}>{context.text}</span>
          <Button size="s" style="link" className={s.linkBtn} onClick={onSetUp}>
            Connect an agent
          </Button>
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
 * Forum → New post, AI Apps → Feedback — so the hint is judged where it sits.
 * The two switches pick the host and whether the member has an agent yet.
 */
export function McpHintsPreview({ onSetUp }: { onSetUp: () => void }) {
  const [key, setKey] = useState<HintKey>('search');
  const [connected, setConnected] = useState(false);
  const context = CONTEXTS.find((item) => item.key === key)!;

  const hint = (
    <McpHint
      key={`${key}-${connected}`}
      context={context}
      connectedAgent={connected ? 'Claude Code' : null}
      onSetUp={onSetUp}
    />
  );

  const hosts: Record<HintKey, ReactNode> = {
    search: <SearchHost hint={hint} />,
    forum: <ForumPostHost hint={hint} />,
    comments: <FeedbackHost hint={hint} />,
  };

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
          {(
            [
              [false, 'No agent yet'],
              [true, 'Claude Code connected'],
            ] as [boolean, string][]
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={connected === value}
              className={clsx(s.segment, { [s.segmentActive]: connected === value })}
              onClick={() => setConnected(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={s.meta}>{context.trigger}</span>
        <BackendTag>Needs PostHog MCP events: shown, dismissed, connected, prompt copied</BackendTag>
      </div>
      <div key={key}>{hosts[key]}</div>
    </>
  );
}
