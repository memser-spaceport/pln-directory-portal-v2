'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';

import { ChatInput } from '@/components/core/husky/ChatInput';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { useCanRequestIntro } from '@/services/intro-requests/hooks/useCanRequestIntro';
import { LABOS_AGENT_MAX_MENTIONS, LABOS_AGENT_MENTION_TEXT } from '@/services/labos-agent/constants';
import { PAGE_NOT_FOUND_CODES, useLabosAgentChat } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { useLabosAgentMentionSearch } from '@/services/labos-agent/hooks/useLabosAgentMentionSearch';
import { isLabosAgentMock } from '@/services/labos-agent/labos-agent.config';
import { keepInteractive } from '@/services/labos-agent/labos-agent.dialogs';
import {
  contextMentionKey,
  pickerGroups,
  readAtQuery,
  replaceAtQuery,
  toMentionChip,
} from '@/services/labos-agent/labos-agent.mentions';
import { useLabosAgentStore } from '@/services/labos-agent/store';
import type {
  LabosAgentMentionChip,
  LabosAgentOpenContext,
  LabosAgentOpenPage,
  LabosAgentPickerItem,
} from '@/types/labos-agent.types';

import { LabosAgentMentionPicker } from '../LabosAgentMentionPicker/LabosAgentMentionPicker';
import { LabosAgentTurn } from '../LabosAgentTurn/LabosAgentTurn';

import s from './LabosAgentPanel.module.scss';

interface LabosAgentPanelProps {
  context: LabosAgentOpenContext | null;
  onClose: () => void;
  /** LAB-3302: the panel opened over the news story modal. It goes above the story's overlay. */
  overModal?: boolean;
}

const NETWORK_PROMPTS = ['What happened in the network this week?'];

/** S5 pages (member, team, job, profile) get the network prompt only. Page prompts wait for a design pass. */
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

/** Sets a textarea value the way typing does, so the composer's own `onChange` (height, `@` check) runs. */
function setNativeValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** The open picker. `at`: `@` in the composer, `start` is the index of the `@`. `plus`: the + button. */
type PickerState = { mode: 'at' | 'plus'; query: string; start: number };

/**
 * The member's agent, docked on the right (home-v2-b's AgentPanel, homepage-redesign-v0-agent design). It reads the
 * page it was opened on (`context`), shows its steps, streams its answer and lists its sources. S1: answers only, no
 * writes. Phones: a full-screen sheet. From 960px: a 480px column over the page's right edge.
 */
export function LabosAgentPanel({ context, onClose, overModal = false }: LabosAgentPanelProps) {
  const {
    turns,
    busy,
    send,
    retry,
    stop,
    newChat,
    decide,
    editDraft,
    sendDraft,
    cancelDraft,
    markTextRestored,
    markMentionsRestored,
  } = useLabosAgentChat(context);
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
  /* S6-F18, S6-F19: the placeholder by role. */
  const canRequestIntro = useCanRequestIntro();

  /* S6 @mentions: the chips of the next message and the open picker. */
  const [chips, setChips] = useState<LabosAgentMentionChip[]>([]);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef(picker);
  // S6-F2: the start of an `@` that Esc closed. The picker opens again only for a new `@`.
  const closedAtRef = useRef<number | null>(null);
  const pickerId = useId();
  const listboxId = `${pickerId}-listbox`;
  useEffect(() => {
    pickerRef.current = picker;
  }, [picker]);
  const limitReached = chips.length >= LABOS_AGENT_MAX_MENTIONS;
  const search = useLabosAgentMentionSearch(picker && !limitReached ? picker.query : null);
  const pageKey = readsPage ? contextMentionKey(context) : null;
  const groups = useMemo(
    () =>
      picker && !limitReached
        ? pickerGroups({
            query: picker.query,
            response: search.response,
            taken: new Set([...chips.map((c) => c.key), ...(pageKey ? [pageKey] : [])]),
            currentPageLabel: label && !readsPage ? label : null,
          })
        : [],
    [picker, limitReached, search.response, chips, pageKey, label, readsPage],
  );
  const flat = groups.flatMap((g) => g.items);
  const activePos = flat.length ? Math.min(activeIndex, flat.length - 1) : -1;
  const active = activePos >= 0 ? flat[activePos] : undefined;
  // S6-F9: the composer or the + search field keeps the focus, so `aria-activedescendant` names the active row.
  const activeOptionId = active ? `${pickerId}-option-${activePos}` : undefined;

  // S6-F11: a new query or mode moves the highlight back to the first option.
  const pickerKey = picker ? `${picker.mode}:${picker.query}` : null;
  const [activeFor, setActiveFor] = useState(pickerKey);
  if (activeFor !== pickerKey) {
    setActiveFor(pickerKey);
    setActiveIndex(0);
  }

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

  /*
   * S5-C29: C1 cannot read the page of the chip (404 MEMBER_NOT_FOUND, TEAM_NOT_FOUND or JOB_NOT_FOUND). The turn
   * keeps the member's text, and the text goes back in an empty composer, so the member can remove the chip and send.
   * Once only: a new open of the panel does not put the text back again (the chip is off then, see `openAgent`).
   */
  const lastTurn = turns[turns.length - 1];
  const pageErrorTurn =
    lastTurn?.status === 'error' &&
    lastTurn.error &&
    !lastTurn.textRestored &&
    lastTurn.error.mentionIndex === undefined &&
    PAGE_NOT_FOUND_CODES.has(lastTurn.error.code)
      ? lastTurn
      : null;
  useEffect(() => {
    const input = inputRef.current;
    if (!pageErrorTurn || !input) return;
    if (!input.value.trim()) input.value = pageErrorTurn.message;
    markTextRestored(pageErrorTurn.id);
  }, [pageErrorTurn, markTextRestored]);

  /*
   * S6-F17: C1 cannot read one mention (404 with `mentionIndex`). The chips of that message come back with the failed
   * chip marked, and the text goes back in an empty composer. Once only.
   */
  const mentionErrorTurn =
    lastTurn?.status === 'error' && lastTurn.error?.mentionIndex !== undefined && !lastTurn.mentionsRestored
      ? lastTurn
      : null;
  // The chips come back during render (React's pattern for state that follows a prop), once per failed turn.
  const [restoredTurnId, setRestoredTurnId] = useState<string | null>(null);
  if (mentionErrorTurn && restoredTurnId !== mentionErrorTurn.id) {
    const failedIndex = mentionErrorTurn.error?.mentionIndex;
    setRestoredTurnId(mentionErrorTurn.id);
    setChips((current) =>
      current.length > 0
        ? current
        : (mentionErrorTurn.mentions ?? []).map((chip, i) => (i === failedIndex ? { ...chip, failed: true } : chip)),
    );
  }
  useEffect(() => {
    if (!mentionErrorTurn) return;
    const input = inputRef.current;
    if (input && !input.value.trim()) input.value = mentionErrorTurn.message;
    markMentionsRestored(mentionErrorTurn.id);
  }, [mentionErrorTurn, markMentionsRestored]);

  /*
   * Esc closes the panel from anywhere inside it. Window capture runs before `Modal`'s document capture, so Esc in the
   * panel over a news story closes the panel only, not the story.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !panelRef.current?.contains(document.activeElement)) return;
      e.stopImmediatePropagation();
      // S6-F9: Esc closes the picker first, then the panel.
      if (pickerRef.current) {
        if (pickerRef.current.mode === 'at') closedAtRef.current = pickerRef.current.start;
        setPicker(null);
        inputRef.current?.focus();
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  /* Keep the newest words in view while they arrive. */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const submit = (text: string) => {
    if (!send(text, chips)) return;
    if (inputRef.current) inputRef.current.value = '';
    // S6-F15: the mention chips clear after a send. The page chip stays.
    setChips([]);
    setPicker(null);
  };

  /* S6-F10: an `@` pick puts `@<name> ` in the place of `@<query>` and adds a chip. A + pick adds a chip only. */
  const pick = (item: LabosAgentPickerItem) => {
    const el = inputRef.current;
    const current = pickerRef.current;
    if (current?.mode === 'at' && el) {
      const next = replaceAtQuery(el.value, current.start, current.query, item.mentionName);
      setNativeValue(el, next.value);
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    } else {
      el?.focus();
    }
    if (item.restoresPage) setReadsPage(true);
    else {
      const chip = toMentionChip(item);
      if (chip) {
        setChips((prev) =>
          prev.length >= LABOS_AGENT_MAX_MENTIONS || prev.some((c) => c.key === chip.key) ? prev : [...prev, chip],
        );
      }
    }
    setPicker(null);
  };

  /* S6-F1, S6-F2: `@` at the start or after a space opens the picker. A space or a deleted `@` closes it. */
  const readMention = (el: HTMLTextAreaElement) => {
    const at = readAtQuery(el.value, el.selectionStart ?? el.value.length);
    // After Esc, the same `@` stays closed. A new `@` (or no `@`) clears the mark.
    if (at && at.start === closedAtRef.current) return;
    closedAtRef.current = null;
    if (at) setPicker({ mode: 'at', ...at });
    else if (pickerRef.current?.mode === 'at') setPicker(null);
  };

  /* S6-F9: Up, Down, Enter and Tab move and pick in the open picker, from the composer or the + search field. */
  const pickerKeys = (e: React.KeyboardEvent) => {
    if (!picker) return false;
    // S6-F9: while C4 loads and the `@` picker has no row, Enter does nothing. It does not send `@<query>`.
    if (!flat.length) {
      if (picker.mode === 'at' && search.status === 'loading' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const from = Math.min(activeIndex, flat.length - 1);
      setActiveIndex((from + (e.key === 'ArrowDown' ? 1 : flat.length - 1)) % flat.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (active) pick(active);
      return true;
    }
    return false;
  };

  return (
    <aside
      ref={(el) => {
        panelRef.current = el;
        if (overModal) keepInteractive(el);
      }}
      className={clsx(s.panel, overModal && s.overModal)}
      aria-label="Agent"
    >
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
          turns.map((t, i) => (
            <div key={t.id} className={s.turnPair}>
              <div className={s.userTurn}>{t.message}</div>
              {/* S6-F20: fixed text above the first answer of a chat that reads no page and no item. */}
              {i === 0 && t.readsNothing && t.status !== 'error' && (
                <p className={s.noContext}>{LABOS_AGENT_MENTION_TEXT.noContext}</p>
              )}
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
        {picker && (
          <LabosAgentMentionPicker
            mode={picker.mode}
            query={picker.query}
            groups={groups}
            activeKey={active?.key}
            listboxId={listboxId}
            optionIdPrefix={`${pickerId}-option`}
            activeOptionId={activeOptionId}
            status={search.status}
            limitReached={limitReached}
            onQuery={(q) => setPicker({ mode: 'plus', query: q, start: 0 })}
            onKeyDown={pickerKeys}
            onHover={(key) =>
              setActiveIndex(
                Math.max(
                  0,
                  flat.findIndex((f) => f.key === key),
                ),
              )
            }
            onPick={pick}
          />
        )}
        <div className={s.chipRow} role="group" aria-label="What the agent reads">
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
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={clsx(s.contextRow, s.mentionChip, chip.failed && s.mentionChipFailed)}
              data-failed={chip.failed ? 'true' : undefined}
              title={chip.failed ? `The agent cannot read ${chip.label}` : `The agent reads ${chip.label}`}
            >
              <span className={s.context}>
                <span className={s.contextText}>{chip.label}</span>
              </span>
              <button
                type="button"
                className={s.contextRemove}
                aria-label={`Remove ${chip.label}`}
                onClick={() => {
                  // S6-F13: the chip goes. The `@name` text stays in the message.
                  setChips((prev) => prev.filter((c) => c.key !== chip.key));
                  inputRef.current?.focus();
                }}
              >
                <CloseIcon />
              </button>
            </span>
          ))}
          <button
            type="button"
            className={s.mentionAdd}
            aria-label="Add context"
            aria-expanded={picker?.mode === 'plus'}
            disabled={limitReached}
            title={LABOS_AGENT_MENTION_TEXT.addTooltip}
            onClick={() => setPicker((cur) => (cur?.mode === 'plus' ? null : { mode: 'plus', query: '', start: 0 }))}
          >
            +
          </button>
        </div>
        <ChatInput
          ref={inputRef}
          className={s.composer}
          rows={1}
          maxLength={2000}
          placeholder={
            canRequestIntro ? LABOS_AGENT_MENTION_TEXT.placeholderIntro : LABOS_AGENT_MENTION_TEXT.placeholderOther
          }
          aria-label="Message the agent"
          // S6-F9: in `@` mode the composer controls the picker (ARIA combobox).
          {...(picker?.mode === 'at'
            ? {
                role: 'combobox',
                'aria-expanded': true,
                'aria-autocomplete': 'list' as const,
                'aria-controls': limitReached ? undefined : listboxId,
                'aria-activedescendant': activeOptionId,
              }
            : {})}
          onTextSubmit={() => submit(inputRef.current?.value ?? '')}
          onStopStreaming={stop}
          isLoadingObject={busy}
          onChange={(e) => readMention(e.currentTarget)}
          onKeyDown={(e) => {
            if (pickerKeys(e)) return;
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
