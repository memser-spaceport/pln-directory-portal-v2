'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { ChatInput } from '@/components/core/husky/ChatInput';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { isLabosAgentMock } from '@/services/labos-agent/labos-agent.config';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type { LabosAgentOpenContext, LabosAgentOpenPage } from '@/types/labos-agent.types';

import { LabosAgentTurn } from '../LabosAgentTurn/LabosAgentTurn';

import s from './LabosAgentPanel.module.scss';

interface LabosAgentPanelProps {
  context: LabosAgentOpenContext | null;
  onClose: () => void;
}

const NETWORK_PROMPTS = ['What happened in the network this week?'];

/** S5 pages (member, team, job, profile) go to C1 as `home` for now, so they get the network prompt only. */
const PROMPTS: Record<LabosAgentOpenPage | 'none', string[]> = {
  'news-story': ['Summarize this story', 'Why does this matter?', 'Which other teams work on this?'],
  home: NETWORK_PROMPTS,
  intro: [],
  member: NETWORK_PROMPTS,
  team: NETWORK_PROMPTS,
  job: NETWORK_PROMPTS,
  profile: NETWORK_PROMPTS,
  none: NETWORK_PROMPTS,
};

const PAGE_LABELS: Record<LabosAgentOpenPage, string> = {
  'news-story': 'News story',
  home: 'Home',
  intro: 'Intro request',
  member: 'Member profile',
  team: 'Team page',
  job: 'Jobs',
  profile: 'Your profile',
};

const contextLabel = (context: LabosAgentOpenContext | null) => {
  if (!context) return null;
  return context.label || PAGE_LABELS[context.page];
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
  const readsPage = useLabosAgentStore((st) => st.readsPage);
  const setReadsPage = useLabosAgentStore((st) => st.actions.setReadsPage);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const label = contextLabel(context);
  /* LAB-3302: the chip ✕ stops the page context. The empty state then talks about the network only. */
  const page = readsPage ? (context?.page ?? 'none') : 'none';
  /* The panel is client-only, so localStorage is safe to read here. */
  const [mock] = useState(() => isLabosAgentMock());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* S3: the caller's first message goes in the composer. The member can change it before they send. */
  useEffect(() => {
    if (prefill === null || !inputRef.current) return;
    // A second press of "Ask the agent" keeps the text that the member already typed.
    if (!inputRef.current.value.trim()) inputRef.current.value = prefill;
    inputRef.current.focus();
    const end = inputRef.current.value.length;
    inputRef.current.setSelectionRange(end, end);
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
              {page === 'news-story'
                ? 'I read this story with you and can search LabOS news and the web.'
                : page === 'intro'
                  ? 'I can write a draft of your intro request. You check it and send it.'
                  : 'I can search LabOS news and the web for you.'}
            </p>
            <ul className={s.prompts}>
              {PROMPTS[page].map((p) => (
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
        {label && readsPage && (
          <span className={s.contextRow}>
            {context?.page === 'news-story' ? (
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
            )}
            <button
              type="button"
              className={s.contextRemove}
              aria-label={`Stop reading ${label}`}
              title="The agent stops reading this page"
              onClick={() => {
                setReadsPage(false);
                inputRef.current?.focus();
              }}
            >
              <CloseIcon />
            </button>
          </span>
        )}
        {label && !readsPage && (
          <button type="button" className={s.contextAdd} onClick={() => setReadsPage(true)}>
            + Read {label}
          </button>
        )}
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
