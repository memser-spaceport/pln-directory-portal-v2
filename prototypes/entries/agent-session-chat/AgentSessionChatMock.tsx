'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { HIDDEN_MESSAGE_TYPES, WAITING_FOR_INPUT_STATUS } from '@/services/agent-sessions/constants';
import type { AgentSession, AgentSessionMessage } from '@/services/agent-sessions/agent-sessions.service';
import { formatDate, SessionStatusBadge } from '@/components/page/agent-sessions/shared/sessionStatus';
import s from '@/components/page/agent-sessions/AgentSessionChat/AgentSessionChat.module.scss';

/**
 * Copy-simplify of `components/page/agent-sessions/AgentSessionChat`.
 *
 * Copied because the original is built on react-query (`useAgentSessionMessages`
 * polls, `useSendAgentSessionMessage` launches a Kubernetes job). Messages and the
 * send handler come in as props instead; the loading and request-error branches are
 * dropped, since neither can occur against local state.
 *
 * Everything else — markup, class names, the `sender`-not-`message_type` alignment
 * rule, the scroll-on-own-send behaviour — is transcribed verbatim, and the styles
 * are the production module imported read-only rather than re-authored.
 *
 * One further omission: production sets `autoFocus` on the textarea while the agent
 * is waiting. Here the state is reachable from a switcher, so autofocus would jump
 * the page to the docked composer every time a reviewer changes scenario.
 */

function MarkdownLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
}

/**
 * Alignment keys off `sender`, never `message_type`: an admin's follow-up arrives
 * as `instruction`, the same type as the original prompt, so typing off the type
 * would put the admin's own messages on the agent's side.
 */
function MessageBubble({ message }: { message: AgentSessionMessage }) {
  const isAdmin = message.sender === 'admin';
  const isQuestion = message.message_type === 'question';

  return (
    <li className={`${s.row} ${isAdmin ? s.rowAdmin : s.rowAgent}`}>
      <div className={`${s.bubble} ${isAdmin ? s.bubbleAdmin : s.bubbleAgent} ${isQuestion ? s.bubbleQuestion : ''}`}>
        <div className={s.bubbleMeta}>
          <span className={s.bubbleSender}>{isAdmin ? 'You' : 'Agent'}</span>
          {isQuestion ? <span className={s.questionTag}>question</span> : null}
          <span className={s.bubbleTime}>{formatDate(message.created_at)}</span>
        </div>
        {isAdmin ? (
          <p className={s.plainBody}>{message.body}</p>
        ) : (
          // No rehype-raw: react-markdown escapes embedded HTML rather than
          // executing it, so agent output cannot inject markup.
          <div className={s.markdownBody}>
            <ReactMarkdown components={{ a: MarkdownLink }}>{message.body}</ReactMarkdown>
          </div>
        )}
      </div>
    </li>
  );
}

interface Props {
  readonly session: AgentSession;
  readonly messages: AgentSessionMessage[];
  readonly isSending: boolean;
  readonly onSend: (message: string) => void;
}

export function AgentSessionChatMock({ session, messages: allMessages, isSending, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const messages = useMemo(
    () => allMessages.filter((message) => !HIDDEN_MESSAGE_TYPES.has(message.message_type)),
    [allMessages],
  );

  const isWaitingForInput = session.status === WAITING_FOR_INPUT_STATUS;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    onSend(message);
    setDraft('');
    // Only ever scrolls on the admin's own send — polling must not yank someone
    // who scrolled up to read a long reply.
    threadEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  };

  return (
    <div className={s.root}>
      {isWaitingForInput ? (
        <div className={s.waitingBanner}>
          <strong>The agent is waiting for your answer.</strong> It stopped to ask a question and will not continue
          until you reply.
        </div>
      ) : null}

      <div className={s.thread}>
        {!messages.length ? <p className={s.state}>No messages yet.</p> : null}

        {messages.length ? (
          <ul className={s.messages}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        ) : null}

        {/* A run can end without a closing agent message — the outcome lives only on
            the session. Without this the thread just trails off after "AI agent started". */}
        <div className={s.outcome}>
          <SessionStatusBadge status={session.status} />
          {session.error_message ? <span className={s.outcomeError}>{session.error_message}</span> : null}
        </div>

        <div ref={threadEndRef} />
      </div>

      <form className={s.composer} onSubmit={handleSubmit}>
        {/* Inner wrapper keeps the controls aligned with the page column while the
            bar itself spans the viewport. */}
        <div className={s.composerInner}>
          <label className={s.composerLabel} htmlFor="agent-session-message">
            Message the agent
          </label>
          <textarea
            id="agent-session-message"
            className={s.textarea}
            value={draft}
            disabled={isSending}
            placeholder="Describe the change you want — vague instructions cost a full agent run."
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                handleSubmit(event);
              }
            }}
          />
          <div className={s.composerFooter}>
            {/* Sending is not a chat bubble — it launches a Kubernetes job that
                continues the agent from this branch. Say so plainly. */}
            <span className={s.composerHint}>
              {session.working_branch
                ? `Sending starts a new agent run on ${session.working_branch}.`
                : 'Sending starts a new agent run.'}
            </span>
            <button type="submit" className={s.sendButton} disabled={!draft.trim() || isSending}>
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
