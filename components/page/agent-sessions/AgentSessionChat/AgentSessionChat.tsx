'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import {
  useAgentSessionMessages,
  useSendAgentSessionMessage,
} from '@/services/agent-sessions/hooks/useAgentSessionMessages';
import { HIDDEN_MESSAGE_TYPES, WAITING_FOR_INPUT_STATUS } from '@/services/agent-sessions/constants';
import type { AgentSession, AgentSessionMessage } from '@/services/agent-sessions/agent-sessions.service';
import { formatDate, SessionStatusBadge } from '../shared/sessionStatus';
import s from './AgentSessionChat.module.scss';

/** How close to the bottom counts as "following along" for autoscroll purposes. */
const NEAR_BOTTOM_PX = 80;

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
  readonly sessionId: string;
  readonly session: AgentSession | undefined;
}

export function AgentSessionChat({ sessionId, session }: Props) {
  const messagesQuery = useAgentSessionMessages(sessionId, session?.status);
  const sendMutation = useSendAgentSessionMessage(sessionId);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const wasNearBottomRef = useRef(true);

  const messages = useMemo(
    () => (messagesQuery.data ?? []).filter((message) => !HIDDEN_MESSAGE_TYPES.has(message.message_type)),
    [messagesQuery.data],
  );

  const isWaitingForInput = session?.status === WAITING_FOR_INPUT_STATUS;
  const newestId = messages.length ? messages[messages.length - 1].id : null;

  // Track the scroll position *before* the DOM updates, so a polling refresh never
  // yanks an admin who scrolled up to read a long reply.
  const handleScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    wasNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_PX;
  };

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !wasNearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [newestId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sendMutation.isPending) return;

    setSendError(null);
    try {
      await sendMutation.mutateAsync(message);
      setDraft('');
      wasNearBottomRef.current = true;
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  return (
    <div className={s.root}>
      {isWaitingForInput ? (
        <div className={s.waitingBanner}>
          <strong>The agent is waiting for your answer.</strong> It stopped to ask a question and will not continue
          until you reply.
        </div>
      ) : null}

      <div className={s.thread} ref={threadRef} onScroll={handleScroll}>
        {messagesQuery.isLoading ? <p className={s.state}>Loading messages…</p> : null}

        {messagesQuery.isError ? (
          <p className={`${s.state} ${s.error}`}>
            {messagesQuery.error instanceof Error ? messagesQuery.error.message : 'Failed to load messages'}
          </p>
        ) : null}

        {!messagesQuery.isLoading && !messagesQuery.isError && !messages.length ? (
          <p className={s.state}>No messages yet.</p>
        ) : null}

        {messages.length ? (
          <ul className={s.messages}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        ) : null}

        {/* A run can end without a closing agent message — the outcome lives only on
            the session. Without this the thread just trails off after "AI agent started". */}
        {session ? (
          <div className={s.outcome}>
            <SessionStatusBadge status={session.status} />
            {session.error_message ? <span className={s.outcomeError}>{session.error_message}</span> : null}
          </div>
        ) : null}
      </div>

      <form className={s.composer} onSubmit={handleSubmit}>
        <label className={s.composerLabel} htmlFor="agent-session-message">
          Message the agent
        </label>
        <textarea
          id="agent-session-message"
          className={s.textarea}
          value={draft}
          autoFocus={isWaitingForInput}
          disabled={sendMutation.isPending}
          placeholder="Describe the change you want — vague instructions cost a full agent run."
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              void handleSubmit(event);
            }
          }}
        />
        <div className={s.composerFooter}>
          {/* Sending is not a chat bubble — it launches a Kubernetes job that
              continues the agent from this branch. Say so plainly. */}
          <span className={s.composerHint}>
            {session?.working_branch
              ? `Sending starts a new agent run on ${session.working_branch}.`
              : 'Sending starts a new agent run.'}
          </span>
          <button type="submit" className={s.sendButton} disabled={!draft.trim() || sendMutation.isPending}>
            {sendMutation.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
        {sendError ? <p className={`${s.state} ${s.error}`}>{sendError}</p> : null}
      </form>
    </div>
  );
}
