'use client';

import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'markdown-to-jsx';

import {
  HIDDEN_MESSAGE_TYPES,
  TERMINAL_SESSION_STATUSES,
  WAITING_FOR_INPUT_STATUS,
} from '@/services/agent-sessions/constants';
import type { AgentSession, AgentSessionMessage } from '@/services/agent-sessions/agent-sessions.service';
import { SessionStatusBadge } from '@/components/page/agent-sessions/shared/sessionStatus';
import { clearFormDraft, readFormDraft, writeFormDraft } from '@/utils/formDraftStorage';
import s from '@/components/page/agent-sessions/AgentSessionChat/AgentSessionChat.module.scss';

import proto from './AgentSessionChatPrototype.module.scss';

/**
 * Copy-simplify of `components/page/agent-sessions/AgentSessionChat`.
 *
 * Copied because the original is built on react-query (`useAgentSessionMessages`
 * polls, `useSendAgentSessionMessage` launches a Kubernetes job). Messages and the
 * send handler come in as props instead; the loading and request-error branches are
 * dropped, since neither can occur against local state.
 *
 * Markup, class names, the `sender`-not-`message_type` alignment rule and the
 * scroll-on-own-send behaviour are transcribed verbatim, and the production styles
 * are imported read-only.
 *
 * One further omission: production sets `autoFocus` on the textarea while the agent
 * is waiting. Here the state is reachable from a switcher, so autofocus would jump
 * the page to the docked composer every time a reviewer changes scenario.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DELIBERATE DESIGN DEVIATIONS from production, all layered in `proto` classes so
 * the production stylesheet stays untouched. Each is a fix for something measured
 * on the real page, not a preference:
 *
 * 1. The composer's footprint is measured, and reserved OUTSIDE the card.
 *    Production reserves the composer's worst case (264px) as `padding-bottom` on
 *    the thread — inside the white panel. Measured: the bar is 181px, so 83px is
 *    over-reserved, and because the reservation lives in the card the panel ran
 *    644px past its last message as blank white.
 *
 * 2. The waiting state moved from a banner at the top of the thread onto the
 *    composer. "The agent is blocked" and "reply to unblock it" were at opposite
 *    ends of a page you scroll, and the banner was the third rendering of a status
 *    the sticky header badge and the outcome row already carried.
 *
 * 3. The outcome row renders only once the run is over — and carries the run's
 *    exits rather than a second copy of the sticky header's badge. See `RunOutcome`.
 *
 * 4. The textarea grows to fit instead of opening at 84px with a drag handle.
 *
 * 5. `markdown-to-jsx` instead of `react-markdown`. react-markdown does not parse
 *    GFM tables without `remark-gfm`, which is not a dependency of this app — so an
 *    agent reply containing a table rendered as a run of raw pipes. This is the
 *    engine `components/common/Markdown.tsx` already uses. The production fix is to
 *    add `remark-gfm`; that's a package.json change, which a prototype can't make.
 *
 * 6. The draft survives. Verified broken on the real page: type a reply, click
 *    Overview to check the branch the agent is asking about, click back — the
 *    textarea is empty, because the tab switch unmounts this component. Reuses
 *    `utils/formDraftStorage` (versioned envelope, 30-day TTL), the same primitive
 *    behind `hooks/useFormDraft`, so it survives reload too.
 *
 * 7. A failed run shows its diagnostics and offers a retry. `error_code`,
 *    `kubernetes_namespace` and `kubernetes_job_name` are all on the session and
 *    were rendered nowhere in the app. Retry is a *secondary* control: the docked
 *    Send button is this surface's one primary, and two filled blue buttons a thumb
 *    apart is two primaries.
 *
 * 8. Accessibility, all verified in the browser: the thread is a polite live
 *    region (agent replies arrive by 5s polling and were announced never), the
 *    composer hint is wired to the textarea with `aria-describedby` (a screen
 *    reader user had no way to learn that Send launches a Kubernetes job),
 *    timestamps are real `<time>` elements, and the panel has a heading — the
 *    visual design carries that with the tab, so it is screen-reader only.
 *
 * 9. The question alarm switches off once the question is answered. Production
 *    paints every `message_type: 'question'` bubble amber and tags it, forever — so
 *    a finished run's transcript still shouts about a decision taken twenty minutes
 *    earlier, and amber stops meaning "this needs you". Amber is now spent on the
 *    question the run is *actually* stopped on; answered ones keep the tag in the
 *    neutral badge tone so the transcript still reads as Q -> A.
 *
 * 10. The cost warning left the placeholder. "Vague instructions cost a full agent
 *    run" was placeholder-only, i.e. it disappeared at the exact moment someone
 *    started writing a vague instruction. The persistent hint under the field makes
 *    the same claim in stronger words ("Sending starts a new agent run on
 *    <branch>"), so the placeholder is back to naming the field's job and the cost
 *    stays on screen while you type.
 */

const MARKDOWN_OPTIONS = {
  overrides: {
    // Agent replies routinely link the PR they opened, and the thread is not the
    // page the reader is on — every link leaves.
    a: { props: { target: '_blank', rel: 'noopener noreferrer' } },
  },
  // markdown-to-jsx renders raw HTML by default. Agent output is untrusted text, so
  // it gets escaped exactly as react-markdown escaped it.
  disableParsingRawHTML: true,
};

/** Bubble clock. The date is constant across a session and lives on Overview. */
function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return value;
  }
}

/** The human-readable full stamp, kept one hover away from every short time. */
function fullStamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

/** Anything with its own scroll region is exempt from the prose measure cap. */
function hasWideContent(body: string) {
  return body.includes('```') || /^\s*\|.*\|/m.test(body);
}

/**
 * Alignment keys off `sender`, never `message_type`: an admin's follow-up arrives
 * as `instruction`, the same type as the original prompt, so typing off the type
 * would put the admin's own messages on the agent's side.
 */
function MessageBubble({ message, isLiveQuestion }: { message: AgentSessionMessage; isLiveQuestion: boolean }) {
  const isAdmin = message.sender === 'admin';
  const isQuestion = message.message_type === 'question';
  const wide = !isAdmin && hasWideContent(message.body);

  return (
    <li className={`${s.row} ${isAdmin ? s.rowAdmin : s.rowAgent}`}>
      <div
        className={[
          s.bubble,
          proto.bubble,
          wide ? proto.bubbleWide : '',
          isAdmin ? s.bubbleAdmin : s.bubbleAgent,
          // Amber is this page's "a person is needed" colour — the same one the
          // `waiting_for_input` badge and the composer wear. It is spent on the one
          // question the run is stopped on, and on nothing else.
          isLiveQuestion ? s.bubbleQuestion : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className={s.bubbleMeta}>
          <span className={s.bubbleSender}>{isAdmin ? 'You' : 'Agent'}</span>
          {isQuestion ? (
            // The tag stays on answered questions — it is what makes a transcript
            // readable as a decision point rather than a wall of replies. Only the
            // alarm tone is spent down, to the neutral badge pair this feature
            // already uses for "a state, but not one that needs you".
            <span className={`${s.questionTag} ${isLiveQuestion ? '' : proto.questionTagAnswered}`}>question</span>
          ) : null}
          {/* Time only, and a real `<time>`: the date repeated on every bubble is a
              constant and the seconds are precision nobody reads. `dateTime` keeps
              the machine-readable stamp; `title` keeps the human one on hover. */}
          <time
            className={`${s.bubbleTime} ${proto.bubbleTime} ${isAdmin ? proto.bubbleTimeOnBrand : ''}`}
            dateTime={message.created_at}
            title={fullStamp(message.created_at)}
          >
            {formatTime(message.created_at)}
          </time>
        </div>
        {isAdmin ? (
          <p className={s.plainBody}>{message.body}</p>
        ) : (
          <div className={`${s.markdownBody} ${proto.markdownBody}`}>
            <Markdown options={MARKDOWN_OPTIONS}>{message.body}</Markdown>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Closes the transcript when a run ends.
 *
 * Production ends the thread with a bare status badge, which is the *third* place
 * that word appears and the only one that scrolls: the sticky header badge is
 * pinned above it the whole time. A duplicate is not what the end of a run needs —
 * what it needs is what the run produced. A finished agent session leaves behind a
 * pull request and, when one was asked for, a live preview of it; both were an
 * Overview-tab round trip away from the message announcing them.
 *
 * Every fact here is already on the session. `pull_request_number`, which nothing in
 * the app rendered, is what turns a 62-character URL into "Pull request #2791".
 */
function RunOutcome({ session }: { session: AgentSession }) {
  const endedAt = session.completed_at || session.updated_at;
  const featureEnvUrl = session.feature_environment_url;

  return (
    <div className={`${s.outcome} ${proto.outcome}`}>
      <div className={proto.outcomeHead}>
        <SessionStatusBadge status={session.status} />
        {endedAt ? (
          <time className={proto.outcomeTime} dateTime={endedAt} title={fullStamp(endedAt)}>
            Finished {formatTime(endedAt)}
          </time>
        ) : null}
      </div>

      {session.pull_request_url || featureEnvUrl ? (
        // Named for where they land, not for the field they came out of — and both
        // plain links, because the docked Send button is this surface's only
        // primary and a run that just finished must not out-shout the composer.
        <div className={proto.outcomeExits}>
          {session.pull_request_url ? (
            <a
              className={proto.outcomeExit}
              href={session.pull_request_url}
              target="_blank"
              rel="noreferrer"
              title={session.pull_request_url}
            >
              {session.pull_request_number ? `Pull request #${session.pull_request_number}` : 'Pull request'}
            </a>
          ) : null}
          {featureEnvUrl ? (
            <a
              className={proto.outcomeExit}
              href={featureEnvUrl}
              target="_blank"
              rel="noreferrer"
              title={featureEnvUrl}
            >
              Feature environment
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Everything an admin needs to act on a failed run, in the place they read that it
 * failed. The job name is what you paste into `kubectl logs`, so it is monospace
 * and `user-select: all`.
 */
function FailureBlock({ session, onRetry }: { session: AgentSession; onRetry: () => void }) {
  const facts: Array<[string, string]> = [];
  if (session.error_code) facts.push(['Error code', session.error_code]);
  if (session.kubernetes_job_name) facts.push(['Kubernetes job', session.kubernetes_job_name]);
  if (session.kubernetes_namespace) facts.push(['Namespace', session.kubernetes_namespace]);

  return (
    <div className={proto.failureBlock}>
      <div className={proto.failureHead}>
        <SessionStatusBadge status={session.status} />
      </div>

      {session.error_message ? <p className={proto.failureMessage}>{session.error_message}</p> : null}

      {facts.length ? (
        <dl className={proto.failureFacts}>
          {facts.map(([label, value]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt className={proto.failureFactLabel}>{label}</dt>
              <dd className={proto.failureFactValue}>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className={proto.failureActions}>
        {/* Re-runs the agent from the same prompt on the same branch. Named for what
            it does, not "Try again" — this costs a full agent run. Secondary,
            because Send is already the filled blue button one thumb below it. */}
        <button type="button" className={proto.retryButton} onClick={onRetry}>
          Retry run
        </button>
      </div>
    </div>
  );
}

interface Props {
  readonly session: AgentSession;
  readonly messages: AgentSessionMessage[];
  readonly isSending: boolean;
  readonly onSend: (message: string) => void;
  readonly onRetry: () => void;
  /** Owned by the page so the draft outlives this component's unmount on tab switch. */
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  readonly draftRestored: boolean;
}

/** Caps the auto-grow. Past this the textarea scrolls rather than eating the page. */
const TEXTAREA_MAX_HEIGHT = 160;
const HINT_ID = 'agent-session-message-hint';

export function AgentSessionChatMock({
  session,
  messages: allMessages,
  isSending,
  onSend,
  onRetry,
  draft,
  onDraftChange,
  draftRestored,
}: Props) {
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const threadHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const composerRef = useRef<HTMLFormElement | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  const messages = useMemo(
    () => allMessages.filter((message) => !HIDDEN_MESSAGE_TYPES.has(message.message_type)),
    [allMessages],
  );

  const isWaitingForInput = session.status === WAITING_FOR_INPUT_STATUS;
  const isFailed = session.status === 'failed' || session.status === 'cancelled';

  /**
   * The one question the run is stopped on: the last thing in the thread, while the
   * session says it is blocked. Anything earlier has been answered — the message
   * under it is the answer — so it is history, not a request.
   */
  const liveQuestionId = useMemo(() => {
    if (!isWaitingForInput) return null;
    const last = messages[messages.length - 1];
    return last && last.sender === 'agent' && last.message_type === 'question' ? last.id : null;
  }, [isWaitingForInput, messages]);

  /**
   * `pr_created` isn't in `TERMINAL_SESSION_STATUSES` — the orchestrator keeps the
   * session live because the env may still be deploying and the PR may still merge.
   * For the transcript it reads as the ending, so it closes the thread too.
   */
  const isRunOver = TERMINAL_SESSION_STATUSES.has(session.status) || session.status === 'pr_created';

  // The bar is `position: fixed`, so nothing in flow accounts for it. Measuring it
  // beats the production constant twice over: it is never wrong, and it tracks the
  // textarea as it grows instead of permanently reserving its maximum.
  useLayoutEffect(() => {
    const node = composerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    // Read the rect rather than `entry.contentRect` — the bar's padding and border
    // are part of what has to be cleared, and contentRect excludes both.
    const observer = new ResizeObserver(() => setComposerHeight(node.getBoundingClientRect().height));
    observer.observe(node);
    setComposerHeight(node.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, []);

  const resizeTextarea = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, []);

  useEffect(resizeTextarea, [draft, resizeTextarea]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    onSend(message);
    // Only ever scrolls on the admin's own send — polling must not yank someone
    // who scrolled up to read a long reply.
    threadEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  };

  /**
   * Retry destroys the button that was pressed — the failure block unmounts the
   * instant the status flips to `running` — which drops keyboard focus to `<body>`
   * and strands a screen reader mid-page. Focus moves to the thread's own heading
   * first, so the next thing announced is the region the reply will arrive in.
   * `preventScroll` because that heading is visually hidden at the top of the panel
   * and the reader is at the bottom of it.
   */
  const handleRetry = () => {
    threadHeadingRef.current?.focus({ preventScroll: true });
    onRetry();
  };

  const hint = isWaitingForInput
    ? 'The run is stopped until you reply — the agent will not continue on its own.'
    : session.working_branch
      ? `Sending starts a new agent run on ${session.working_branch}.`
      : 'Sending starts a new agent run.';

  return (
    <>
      <div className={s.root}>
        <h2 className={proto.srOnly} ref={threadHeadingRef} tabIndex={-1}>
          Conversation
        </h2>

        <div className={`${s.thread} ${proto.thread}`}>
          {/* Reachable: a session that is still queued has no messages yet. Names
              what the empty box is waiting for; the composer hint under it already
              says what sending costs, so this doesn't repeat it. */}
          {!messages.length ? <p className={s.state}>No messages yet — the agent posts here as it works.</p> : null}

          {messages.length ? (
            // Production polls every 5s, so agent replies appear with no user action
            // behind them. Without a live region they were announced never.
            // `role="log"` is the additions-only variant, so only the new message is
            // read out rather than the whole transcript.
            <ul
              className={s.messages}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label="Conversation"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} isLiveQuestion={message.id === liveQuestionId} />
              ))}
            </ul>
          ) : null}

          {/* A run can end without a closing agent message — the outcome lives only
              on the session. Only once it IS over: before that the sticky header
              badge is already saying this, in a place that stays on screen. */}
          {isFailed ? (
            <FailureBlock session={session} onRetry={handleRetry} />
          ) : isRunOver ? (
            <RunOutcome session={session} />
          ) : null}

          <div ref={threadEndRef} />
        </div>
      </div>

      {/* Clearance for the docked bar, kept OUTSIDE the card so the panel ends where
          the conversation ends. Page background, not blank white. */}
      <div aria-hidden style={{ height: composerHeight }} />

      <form
        ref={composerRef}
        className={`${s.composer} ${proto.composer} ${isWaitingForInput ? proto.composerWaiting : ''}`}
        onSubmit={handleSubmit}
      >
        {/* Inner wrapper keeps the controls aligned with the page column while the
            bar itself spans the viewport. */}
        <div className={s.composerInner}>
          <label className={s.composerLabel} htmlFor="agent-session-message">
            {isWaitingForInput ? 'Answer the agent’s question' : 'Message the agent'}
          </label>
          <textarea
            ref={textareaRef}
            id="agent-session-message"
            className={`${s.textarea} ${proto.textarea}`}
            rows={1}
            value={draft}
            disabled={isSending}
            // Wired to the field, not just placed beside it. Without this a screen
            // reader user hears "Message the agent, edit text" and never learns that
            // the button below launches a Kubernetes job.
            aria-describedby={HINT_ID}
            placeholder="Describe the change you want."
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                handleSubmit(event);
              }
            }}
          />
          <div className={s.composerFooter}>
            <div className={proto.composerMeta}>
              {/* Two different facts, and which one matters depends on the state.
                  Blocked: the run is stopped and only a reply restarts it. Otherwise:
                  sending is not a chat message, it launches a fresh agent run. */}
              <span id={HINT_ID} className={`${s.composerHint} ${isWaitingForInput ? proto.composerHintWaiting : ''}`}>
                {hint}
              </span>
              {/* Autosave a person can't see isn't a feature. */}
              {draftRestored ? (
                <span className={`${proto.draftState} ${proto.draftStateRestored}`}>Draft restored</span>
              ) : draft.trim() ? (
                <span className={proto.draftState}>Draft saved</span>
              ) : null}
            </div>
            <button
              type="submit"
              className={`${s.sendButton} ${proto.sendButton}`}
              disabled={!draft.trim() || isSending}
            >
              {isSending ? 'Sending…' : isWaitingForInput ? 'Reply' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

/**
 * Draft persistence, lifted out of the composer so it outlives the tab switch that
 * unmounts it. Backed by `utils/formDraftStorage` — the same versioned envelope and
 * 30-day TTL `hooks/useFormDraft` uses — so a reload restores it too.
 *
 * Keyed per session: two sessions open in two tabs must not share one draft.
 */
export function useComposerDraft(sessionId: string) {
  const storageKey = `agent-session-draft:${sessionId}`;
  const [draft, setDraft] = useState('');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const saved = readFormDraft<string>(storageKey);
    if (typeof saved === 'string' && saved.trim()) {
      setDraft(saved);
      setRestored(true);
    }
  }, [storageKey]);

  // Debounced so a fast typist isn't writing to localStorage on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (draft.trim()) writeFormDraft(storageKey, draft);
      else clearFormDraft(storageKey);
    }, 400);
    return () => window.clearTimeout(id);
  }, [draft, storageKey]);

  const change = useCallback((value: string) => {
    setDraft(value);
    // "Restored" is a one-time greeting, not a persistent state — the moment the
    // person edits, the message is theirs again and the label goes back to saving.
    setRestored(false);
  }, []);

  const clear = useCallback(() => {
    setDraft('');
    setRestored(false);
    clearFormDraft(storageKey);
  }, [storageKey]);

  return { draft, setDraft: change, clearDraft: clear, draftRestored: restored };
}
