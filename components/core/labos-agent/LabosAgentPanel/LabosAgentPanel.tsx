'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { ChatInput } from '@/components/core/husky/ChatInput';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { isLabosAgentMock } from '@/services/labos-agent/labos-agent.config';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { LabosAgentOpenContext } from '@/types/labos-agent.types';

import { LabosAgentTurn } from '../LabosAgentTurn/LabosAgentTurn';

import s from './LabosAgentPanel.module.scss';

interface LabosAgentPanelProps {
  context: LabosAgentOpenContext | null;
  onClose: () => void;
}

const PROMPTS: Record<LabosAgentOpenContext['page'] | 'none', string[]> = {
  'news-story': ['Summarize this story', 'Why does this matter?', 'Which other teams work on this?'],
  home: ['What happened in the network this week?'],
  intro: [],
  none: ['What happened in the network this week?'],
};

const contextLabel = (context: LabosAgentOpenContext | null) => {
  if (!context) return null;
  if (context.label) return context.label;
  if (context.page === 'intro') return 'Intro request';
  return context.page === 'news-story' ? 'News story' : 'Home';
};

/**
 * The member's agent, docked on the right (home-v2-b's AgentPanel, homepage-redesign-v0-agent design). It reads the
 * page it was opened on (`context`), shows its steps, streams its answer and lists its sources. S1: answers only, no
 * writes. Phones: a full-screen sheet. From 960px: a 480px column over the page's right edge.
 */
export function LabosAgentPanel({ context, onClose }: LabosAgentPanelProps) {
  const { turns, busy, send, retry, stop, newChat, decide, editDraft, sendDraft, cancelDraft } =
    useLabosAgentChat(context);
  const prefill = useLabosAgentStore((st) => st.prefill);
  const clearPrefill = useLabosAgentStore((st) => st.actions.clearPrefill);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const label = contextLabel(context);
  /* The panel is client-only, so localStorage is safe to read here. */
  const [mock] = useState(() => isLabosAgentMock());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* S3: the caller's first message goes in the composer. The member can change it before they send. */
  useEffect(() => {
    if (prefill === null || !inputRef.current) return;
    inputRef.current.value = prefill;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(prefill.length, prefill.length);
    clearPrefill();
  }, [prefill, clearPrefill]);

  /* Esc closes the panel from anywhere inside it. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelRef.current?.contains(document.activeElement)) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Keep the newest words in view while they arrive. */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const submit = (text: string) => {
    if (send(text) && inputRef.current) inputRef.current.value = '';
  };

  return (
    <aside ref={panelRef} className={s.panel} aria-label="Agent">
      <header className={s.head}>
        <span className={s.headTitle}>
          <AiSearchIcon size={18} />
          Agent
          {mock && (
            <span className={s.mockLabel} title="localStorage labos-agent-api = mock">
              Mock answers
            </span>
          )}
        </span>
        <span className={s.headActions}>
          {turns.length > 0 && (
            <button type="button" className={s.iconBtn} onClick={newChat} aria-label="New chat" title="New chat">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M11.5 2.5l2 2L8 10H6V8l5.5-5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close agent" title="Close (Esc)">
            <CloseIcon />
          </button>
        </span>
      </header>

      <div ref={threadRef} className={s.thread} aria-live="polite">
        {turns.length === 0 ? (
          <div className={s.empty}>
            <h2 className={s.hello}>What do you want to know?</h2>
            <p className={s.helloSub}>
              {context?.page === 'news-story'
                ? 'I read this story with you and can search LabOS news and the web.'
                : context?.page === 'intro'
                  ? 'I can write a draft of your intro request. You check it and send it.'
                  : 'I can search LabOS news and the web for you.'}
            </p>
            <ul className={s.prompts}>
              {PROMPTS[context?.page ?? 'none'].map((p) => (
                <li key={p}>
                  <button type="button" className={s.prompt} onClick={() => submit(p)}>
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((t) => (
            <div key={t.id} className={s.turnPair}>
              <div className={s.userTurn}>{t.message}</div>
              <LabosAgentTurn
                turn={t}
                busy={busy}
                onFollowUp={submit}
                onRetry={retry}
                onDecide={(turnId, proposalId, decision) => void decide(turnId, proposalId, decision)}
                onDraftEdit={editDraft}
                onDraftSend={(turnId, draftId) => void sendDraft(turnId, draftId)}
                onDraftCancel={cancelDraft}
              />
            </div>
          ))
        )}
      </div>

      <div className={s.foot}>
        {label &&
          (context?.page === 'news-story' ? (
            <Link
              href={`/?news=${encodeURIComponent(context.newsUid)}`}
              className={s.context}
              title="The agent reads this story. Open the story."
            >
              <span className={s.contextText}>{label}</span>
            </Link>
          ) : (
            <span className={s.context} title="The agent reads the page you opened it on">
              <span className={s.contextText}>{label}</span>
            </span>
          ))}
        <ChatInput
          ref={inputRef}
          className={s.composer}
          rows={1}
          maxLength={2000}
          placeholder="Ask a follow-up"
          aria-label="Message the agent"
          onTextSubmit={() => submit(inputRef.current?.value ?? '')}
          onStopStreaming={stop}
          isLoadingObject={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e.currentTarget.value);
            }
          }}
        />
      </div>
    </aside>
  );
}
