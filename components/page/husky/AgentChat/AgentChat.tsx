'use client';

import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import { EnvelopeSimple, User, UsersThree } from '@phosphor-icons/react';

import { DirectoryResultCards } from '@/components/core/application-search/components/DirectoryResultCards';
import { McpHint } from '@/components/core/mcp-hints/McpHint';
import { countAiSearch } from '@/components/core/mcp-hints/aiSearchSessionCount';
import { LabosAgentTurn } from '@/components/core/labos-agent/LabosAgentTurn/LabosAgentTurn';
import { useLabosAgentAnalytics } from '@/analytics/labos-agent.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useCanRequestIntro } from '@/services/intro-requests/hooks/useCanRequestIntro';
import {
  LABOS_AGENT_PAGE_PROMPT_COUNT,
  LABOS_AGENT_PAGE_TEXT,
  labosAgentPageChatKey,
} from '@/services/labos-agent/constants';
import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { useLabosAgentThread } from '@/services/labos-agent/hooks/useLabosAgentThreads';
import { draftTargetKey } from '@/services/labos-agent/labos-agent.drafts';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';
import { sentDrafts, toChatTurns } from '@/services/labos-agent/labos-agent.thread-turns';
import { replacedDraftIds } from '@/services/labos-agent/labos-agent.open-cards';
import { labosAgentRequestPrompts, type LabosAgentRequestTopic } from '@/services/labos-agent/labos-agent.page';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import { useTeamNewsPrompts } from '@/services/team-news/hooks/useTeamNewsPrompts';
import type { LabosAgentMentionChip } from '@/types/labos-agent.types';
import { generateUUID } from '@/utils/common.utils';

import { useSidebar } from '../hooks/useSidebar';
import { ChatTitleBar } from '../Chat/components/ChatTitleBar';

import { AgentChatComposer, type AgentChatComposerHandle } from './components/AgentChatComposer/AgentChatComposer';

import chat from '../Chat/Chat.module.scss';
import home from '../Chat/components/ChatHome/ChatHome.module.scss';
import prompts from '../Chat/components/ChatHome/components/PromptSuggestions/PromptSuggestions.module.scss';
import message from '../Chat/components/Messages/components/PreviewMessage/PreviewMessage.module.scss';
import s from './AgentChat.module.scss';

type DirectoryActions = ComponentProps<typeof DirectoryResultCards>['actions'];

const REQUEST_GLYPHS: Record<LabosAgentRequestTopic, typeof User> = {
  intro: EnvelopeSimple,
  team: UsersThree,
  profile: User,
};

/**
 * AI agent chat when the chat is the agent (LAB-3457, Polina's decision of 2026-11-26, prototype `ai-search-page`).
 * For members inside the agent gate, `/ai-search` sends every message to the agent (C1, `surface: 'page'`) and shows
 * the panel's own turn (`LabosAgentTurn`): steps, the streamed answer, sources, follow-ups, action cards, intro draft
 * cards, errors with Retry. The page keeps its own layout (title bar, reading column, pinned field) and its History
 * rail. The new chat keeps the headline, says what the chat can do, and lists "Try asking" and "Make a request".
 *
 * `threadId` (`/ai-search/<threadId>`): a saved chat from the shared history (T2). Its turns arrive finished, old AI
 * search turns as saved answers; the next message continues the same thread. A thread that is not the member's, or
 * was deleted, is a 404 page.
 */
export function AgentChat({ threadId: savedThreadId }: { threadId?: string } = {}) {
  const [threadId, setThreadId] = useState(() => savedThreadId ?? generateUUID());
  const key = labosAgentPageChatKey(threadId);
  const opensSaved = !!savedThreadId && threadId === savedThreadId;
  const hasChat = useLabosAgentStore((st) => !!st.chats[key]);
  const { ensureChat, markIntroTargetSent } = useLabosAgentStore((st) => st.actions);
  const saved = useLabosAgentThread(opensSaved ? threadId : null, { enabled: opensSaved && !hasChat });

  // The saved turns go into the chat once. A chat already in the store (this page visit) stays as it is.
  useEffect(() => {
    if (!saved.data || saved.data.threadId !== threadId) return;
    sentDrafts(saved.data).forEach((d) => markIntroTargetSent(draftTargetKey(d)));
    ensureChat(key, threadId, toChatTurns(saved.data));
  }, [saved.data, threadId, key, ensureChat, markIntroTargetSent]);
  const {
    turns,
    busy,
    send,
    retry,
    stop,
    decide,
    editDraft,
    sendDraft,
    cancelDraft,
    markTextRestored,
    markMentionsRestored,
  } = useLabosAgentChat(null, { key, threadId, readsContext: true, surface: 'page' });
  const { onSourceClicked } = useLabosAgentAnalytics('page');
  const startPageSession = useLabosAgentStore((st) => st.actions.startPageSession);
  const replacedDrafts = useMemo(() => replacedDraftIds(turns), [turns]);
  const { state } = useSidebar();
  const composerRef = useRef<AgentChatComposerHandle>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // LAB-3297 / LAB-3457: each page chat is one session of the page's agent events.
  useEffect(() => {
    startPageSession(null);
  }, [threadId, startPageSession]);

  // The title bar's + (and the rail's New chat) asks for a new chat. The open answer stops first.
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });
  useEffect(() => {
    const onNewChat = () => {
      stopRef.current();
      setThreadId(generateUUID());
    };
    document.addEventListener('new-chat', onNewChat);
    return () => document.removeEventListener('new-chat', onNewChat);
  }, []);

  // Keep the newest words in view while a turn arrives.
  const lastTurn = turns[turns.length - 1];
  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [turns.length, lastTurn?.content]);

  /** The MCP hint counts the questions the member sends (as on today's page). */
  const sendTyped = useCallback(
    (text: string, chips: LabosAgentMentionChip[]) => {
      const sent = send(text, chips);
      if (sent) countAiSearch();
      return sent;
    },
    [send],
  );

  /*
   * A question handed over by another page (header search "Ask AI", the empty-chat field: `localStorage.input`, as
   * today's page reads it). Read once; the key goes.
   */
  const sendRef = useRef(sendTyped);
  useEffect(() => {
    sendRef.current = sendTyped;
  });
  useEffect(() => {
    // A saved chat is not the new chat that a handed-over question goes to.
    if (savedThreadId) return;
    let handed: string | null = null;
    try {
      handed = localStorage.getItem('input');
      if (handed) localStorage.removeItem('input');
    } catch {
      handed = null;
    }
    if (handed?.trim()) sendRef.current(handed, []);
  }, [savedThreadId]);

  const composer = (size: 'home' | 'thread') => (
    <AgentChatComposer
      key={key}
      ref={composerRef}
      size={size}
      placeholder={LABOS_AGENT_PAGE_TEXT.placeholder}
      busy={busy}
      send={sendTyped}
      onStop={stop}
      lastTurn={lastTurn}
      onTextRestored={markTextRestored}
      onMentionsRestored={markMentionsRestored}
      autoFocus
    />
  );

  if (opensSaved && !hasChat) {
    if (saved.error instanceof LabosAgentError && saved.error.code === 'THREAD_NOT_FOUND') notFound();
    return (
      <>
        <ChatTitleBar chat={saved.data ? { title: saved.data.title } : undefined} />
        <div className={chat.root} aria-busy={!saved.isError}>
          {saved.isError && (
            <p className={s.loadError} role="alert">
              {LABOS_AGENT_PAGE_TEXT.loadFailed}{' '}
              <button type="button" className={s.loadRetry} onClick={() => void saved.refetch()}>
                {LABOS_AGENT_PAGE_TEXT.loadRetry}
              </button>
            </p>
          )}
        </div>
      </>
    );
  }

  if (turns.length === 0) {
    return (
      <>
        <ChatTitleBar />
        <div className={chat.home}>
          <AgentChatHome composer={composer('home')} onPick={(text) => sendTyped(text, [])} />
        </div>
      </>
    );
  }

  return (
    <>
      <ChatTitleBar chat={{ title: (opensSaved && saved.data?.title) || turns[0].message }} />
      <div className={chat.root}>
        <div className={chat.messages}>
          <div className={s.turns}>
            {turns.map((t) => (
              <div key={t.id} className={message.root}>
                <div className={message.questionBlock}>
                  <h2 className={message.questionText}>{t.message}</h2>
                </div>
                <div className={message.contentBlock}>
                  <LabosAgentTurn
                    turn={t}
                    busy={busy}
                    onFollowUp={(q) => sendTyped(q, [])}
                    onRetry={retry}
                    onDecide={(turnId, proposalId, decision) => void decide(turnId, proposalId, decision)}
                    onDraftEdit={editDraft}
                    onDraftSend={(turnId, draftId) => void sendDraft(turnId, draftId)}
                    onDraftCancel={cancelDraft}
                    replacedDrafts={replacedDrafts}
                    onSourceClick={(sourceType, position) => onSourceClicked(null, { sourceType, position })}
                    // An old AI search turn keeps its directory results, drawn as AI search draws them today.
                    afterAnswer={
                      t.savedActions && t.savedActions.length > 0 ? (
                        <DirectoryResultCards actions={t.savedActions as DirectoryActions} />
                      ) : undefined
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          {/* In the scrolling list, under the answer, as on today's page. */}
          <McpHint context="search" query={lastTurn?.message ?? ''} />
          <div ref={endRef} />
        </div>
        <div data-state={state} className={chat.formWrapper}>
          <form className={chat.form} onSubmit={(e) => e.preventDefault()}>
            {composer('thread')}
          </form>
        </div>
      </div>
    </>
  );
}

interface AgentChatHomeProps {
  composer: React.ReactNode;
  onPick: (text: string) => void;
}

/**
 * The new chat (today's `ChatHome` composition): the headline, the line under it, the field, then two columns of
 * three, "Try asking" (the network questions of today's page) and "Make a request" (what this member can have the
 * agent do). Phones stack the columns.
 */
function AgentChatHome({ composer, onPick }: AgentChatHomeProps) {
  const { data } = useTeamNewsPrompts();
  const questions = (Array.isArray(data) ? data : []).slice(0, LABOS_AGENT_PAGE_PROMPT_COUNT);
  const canRequestIntro = useCanRequestIntro();
  const currentUser = useCurrentUserStore((st) => st.currentUser);
  const requests = labosAgentRequestPrompts({ canRequestIntro, user: currentUser }).slice(
    0,
    LABOS_AGENT_PAGE_PROMPT_COUNT,
  );

  return (
    <div className={home.root}>
      <div className={home.header}>
        <h3 className={home.title}>Explore Protocol Labs with AI</h3>
        <p className={home.scope} data-testid="chat-home-scope">
          {LABOS_AGENT_PAGE_TEXT.line}
        </p>
      </div>
      <form className={home.form} onSubmit={(e) => e.preventDefault()}>
        {composer}
      </form>
      <div className={s.columns} data-testid="agent-chat-prompts">
        {questions.length > 0 && (
          <div>
            <div className={prompts.title}>{LABOS_AGENT_PAGE_TEXT.tryAsking}</div>
            <ul className={s.promptList}>
              {questions.map((p) => (
                <li key={p.uid}>
                  <button type="button" className={s.promptRow} onClick={() => onPick(p.question)}>
                    <img alt="" src="/icons/send-black.svg" className={s.promptIcon} />
                    <span>{p.question}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <div className={prompts.title}>{LABOS_AGENT_PAGE_TEXT.makeRequest}</div>
          <ul className={s.promptList}>
            {requests.map((p) => {
              const Glyph = REQUEST_GLYPHS[p.topic];
              return (
                <li key={p.text}>
                  <button type="button" className={s.promptRow} onClick={() => onPick(p.text)}>
                    <Glyph weight="regular" className={s.promptGlyph} aria-hidden />
                    <span>{p.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
