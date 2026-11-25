'use client';

/**
 * The agent's drawer for the "agent" entry. A fork of home-v2-b's AgentPanel (its chrome, steps, streaming
 * and stylesheet, imported), trimmed to the blocks this script uses (text, custom cards, suggestions), with
 * two things the shared panel doesn't have:
 *
 *   - The context row owns its own picker: the chips are what the agent reads (the page you're on first, ✕
 *     to drop it); "+" opens the picker with a search field.
 *   - "@" in the composer opens the same picker, filtered by what you type after it. Picking inserts a short
 *     @name into the message AND adds the chip, so the reference is in the sentence and in the context.
 */

import clsx from 'clsx';
import { LockSimple, Plus, WarningCircle, X } from '@phosphor-icons/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { AiSearchIcon } from '@/components/icons/AiSearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';

import Composer from '../ai-mode-results/Composer';
import { blockUnits, replyUnits, type AgentReply } from '../home-v2-b/agentScript';
import p from '../home-v2-b/AgentPanel.module.scss';
import corner from '../home-v2-agent-dock/AgentCorner.module.scss';

import { ItemGlyph, KIND_LABEL, type AgentItem, type AgentItemKind } from './items';
import type { Prompt } from './script';
import { TopicLabel } from './TopicLabel';
import s from './Agent.module.scss';

const STEP_MS = 650;
const TICK_MS = 35;
const WORDS_PER_TICK = 2;
const GROUP_ORDER: AgentItemKind[] = ['page', 'news', 'team', 'member', 'event', 'forum'];
/** Per group while nothing is typed: enough to show what's there, not the whole network. */
const GROUP_PEEK = 3;

type Turn =
  | { id: number; role: 'user'; text: string }
  | {
      id: number;
      role: 'agent';
      reply: AgentReply;
      step: number;
      units: number;
      done: boolean;
      stopped?: boolean;
      startedAt: number;
      endedAt?: number;
    };

/** How an @mention reads inside the sentence; the chip carries the full name. */
const mentionName = (item: AgentItem) =>
  item.kind === 'news' ? `${item.by} news` : item.kind === 'forum' ? `${item.by}’s thread` : item.label;

/** Sets a textarea's value the way typing does, so the composer's own onChange (height, send button) runs. */
function setNativeValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function AgentChat({
  open,
  onClose,
  reply,
  greeting,
  intro,
  prompts,
  placeholder,
  headTitle,
  headExtra,
  reading,
  page,
  pageReadable = true,
  catalog,
  suggested,
  onAdd,
  onRemove,
  onOpenInAiSearch,
  initialThread,
  initialSend,
  className,
}: {
  open: boolean;
  onClose: () => void;
  reply: (text: string) => AgentReply;
  greeting: string;
  intro: string;
  prompts: Prompt[];
  placeholder: string;
  headTitle: ReactNode;
  headExtra?: ReactNode;
  /** The chips: what the agent reads. */
  reading: AgentItem[];
  /** The page the member is on. It always holds the first slot of the context row (LAB-3389). */
  page: AgentItem;
  /** False for a page the agent may not read (settings, messages): the slot says so and offers nothing. */
  pageReadable?: boolean;
  /**
   * "Open in AI Search" (LAB-3389): copies this chat's questions into a new AI Search thread, in a new tab.
   * Returns false when AI Search couldn't save the thread; the panel then shows the error with Retry.
   */
  onOpenInAiSearch?: (questions: string[]) => boolean;
  /** Everything the picker can add. */
  catalog: AgentItem[];
  /** Listed first in the picker before anything is typed (this page if removed, recently viewed). */
  suggested: AgentItem[];
  onAdd: (item: AgentItem) => void;
  onRemove: (id: string) => void;
  initialThread?: { text: string; reply: AgentReply }[];
  /** Sent once on mount, as if the member typed it (profile-agent-actions' request menu). */
  initialSend?: string;
  className?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>(() =>
    (initialThread ?? []).flatMap((t, i): Turn[] => [
      { id: i * 2 + 1, role: 'user', text: t.text },
      {
        id: i * 2 + 2,
        role: 'agent',
        reply: t.reply,
        step: t.reply.steps.length,
        units: replyUnits(t.reply),
        done: true,
        startedAt: Date.now() - t.reply.steps.length * 2000,
        endedAt: Date.now(),
      },
    ]),
  );
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const nextId = useRef((initialThread?.length ?? 0) * 2 + 1);

  /* The picker: 'at' = opened by "@" (query is what follows it), 'plus' = the + button (its own search). */
  const [picker, setPicker] = useState<{ mode: 'at' | 'plus'; query: string; start: number } | null>(null);
  const [active, setActive] = useState(0);
  const pickerRef = useRef(picker);
  pickerRef.current = picker;

  const working = turns.find((t): t is Extract<Turn, { role: 'agent' }> => t.role === 'agent' && !t.done);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) return;
    const fit = () =>
      panel.style.setProperty('--agent-h', `${window.innerHeight - Math.max(0, panel.getBoundingClientRect().top)}px`);
    fit();
    document.addEventListener('scroll', fit, { capture: true, passive: true });
    window.addEventListener('resize', fit);
    return () => {
      document.removeEventListener('scroll', fit, { capture: true });
      window.removeEventListener('resize', fit);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* Esc: the picker first, then the drawer. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !panelRef.current?.contains(document.activeElement)) return;
      if (pickerRef.current) {
        setPicker(null);
        inputRef.current?.focus();
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!working) return;
    const id = working.id;
    const total = replyUnits(working.reply);
    const inSteps = working.step < working.reply.steps.length;
    const timer = window.setTimeout(
      () =>
        setTurns((prev) =>
          prev.map((t) => {
            if (t.id !== id || t.role !== 'agent') return t;
            if (t.step < t.reply.steps.length) return { ...t, step: t.step + 1 };
            const units = Math.min(total, t.units + WORDS_PER_TICK);
            return units >= total ? { ...t, units, done: true, endedAt: Date.now() } : { ...t, units };
          }),
        ),
      inSteps ? STEP_MS : TICK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [working]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || working) return;
    const userId = nextId.current++;
    const agentId = nextId.current++;
    /* Outside the updater: the script keeps state, and StrictMode runs updaters twice. */
    const r = reply(text);
    setTurns((prev) => [
      ...prev,
      { id: userId, role: 'user', text },
      { id: agentId, role: 'agent', reply: r, step: 0, units: 0, done: false, startedAt: Date.now() },
    ]);
    setPicker(null);
    if (inputRef.current) setNativeValue(inputRef.current, '');
  };

  /* Once per mount; the ref keeps StrictMode's second effect run from asking twice. */
  const initialSent = useRef(false);
  useEffect(() => {
    if (!initialSend || initialSent.current) return;
    initialSent.current = true;
    send(initialSend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () =>
    setTurns((prev) =>
      prev.map((t) => (t.role === 'agent' && !t.done ? { ...t, done: true, stopped: true, endedAt: Date.now() } : t)),
    );

  const newChat = () => {
    setTurns([]);
    setExpanded(new Set());
    setHandoffFailed(false);
    inputRef.current?.focus();
  };

  /* ---------- Open in AI Search ---------- */

  /* The questions that got an answer. Until one has, there is nothing to continue, so the control is
     disabled (ticket AC: "disabled (chat has no answer)"), not hidden: the door is visible from the start. */
  const answered = turns.flatMap((t, i) => {
    const next = turns[i + 1];
    return t.role === 'user' && next?.role === 'agent' && next.done ? [t.text] : [];
  });
  const canOpenInAiSearch = answered.length > 0;
  const [handoffFailed, setHandoffFailed] = useState(false);
  const openInAiSearch = () => {
    if (!onOpenInAiSearch || !canOpenInAiSearch) return;
    setHandoffFailed(!onOpenInAiSearch(answered));
  };

  /* ---------- Picker ---------- */

  const groups = useMemo(() => {
    if (!picker) return [];
    const q = picker.query.trim().toLowerCase();
    const taken = new Set(reading.map((r) => r.id));
    const pool = [...suggested, ...catalog.filter((c) => !suggested.some((x) => x.id === c.id))].filter(
      (i) => !taken.has(i.id),
    );
    const match = (i: AgentItem) => !q || `${i.label} ${i.meta}`.toLowerCase().includes(q);
    return GROUP_ORDER.map((kind) => {
      const all = pool.filter((i) => i.kind === kind && match(i));
      return { kind, items: q ? all.slice(0, 6) : all.slice(0, GROUP_PEEK) };
    }).filter((g) => g.items.length);
  }, [picker, reading, catalog, suggested]);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => setActive(0), [picker?.query, picker?.mode]);

  const pick = (item: AgentItem) => {
    const el = inputRef.current;
    if (picker?.mode === 'at' && el) {
      const before = el.value.slice(0, picker.start);
      const after = el.value.slice(picker.start + 1 + picker.query.length);
      const insert = `@${mentionName(item)} `;
      setNativeValue(el, `${before}${insert}${after.replace(/^\s/, '')}`);
      const caret = before.length + insert.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    } else {
      el?.focus();
    }
    onAdd(item);
    setPicker(null);
  };

  /* "@" right after a space or at the start opens the picker; what follows it (no spaces yet) filters it. */
  const readMention = (el: HTMLTextAreaElement) => {
    const upto = el.value.slice(0, el.selectionStart ?? el.value.length);
    const m = upto.match(/(^|\s)@([^\s@]{0,30})$/);
    if (m) setPicker({ mode: 'at', query: m[2], start: upto.length - m[2].length - 1 });
    else if (pickerRef.current?.mode === 'at') setPicker(null);
  };

  /** Arrow keys / Enter / Tab drive the open picker, from the composer or the picker's own search. */
  const pickerKeys = (e: React.KeyboardEvent) => {
    if (!picker || !flat.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : flat.length - 1)) % flat.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(flat[Math.min(active, flat.length - 1)]);
      return true;
    }
    return false;
  };

  /* ---------- Thread ---------- */

  const renderAgent = (t: Extract<Turn, { role: 'agent' }>) => {
    const stepping = t.step < t.reply.steps.length && !t.done;
    const showSteps = stepping || expanded.has(t.id);
    const seconds = Math.max(1, Math.round(((t.endedAt ?? Date.now()) - t.startedAt) / 1000));
    let budget = t.done && !t.stopped ? Infinity : t.units;

    return (
      <div key={t.id} className={p.agentTurn}>
        {t.reply.steps.length > 0 &&
          (stepping ? (
            <div className={p.workingLine}>
              <span className={p.spinner} aria-hidden />
              Working
            </div>
          ) : (
            <button
              type="button"
              className={p.workedToggle}
              aria-expanded={showSteps}
              onClick={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(t.id)) next.delete(t.id);
                  else next.add(t.id);
                  return next;
                })
              }
            >
              Worked for {seconds}s · {t.reply.steps.length} {t.reply.steps.length === 1 ? 'step' : 'steps'}
              <svg viewBox="0 0 16 16" fill="none" aria-hidden className={p.caret}>
                <path
                  d={showSteps ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        {showSteps && (
          <ol className={p.steps}>
            {t.reply.steps.slice(0, t.done ? undefined : t.step + 1).map((label, i) => {
              const isActive = !t.done && i === t.step;
              return (
                <li key={label} className={clsx(p.step, isActive && p.stepActive)}>
                  {isActive ? (
                    <span className={p.stepSpinner} aria-hidden />
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={p.stepCheck}>
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {label}
                </li>
              );
            })}
          </ol>
        )}

        {!stepping &&
          t.reply.blocks.map((b, i) => {
            if (budget <= 0) return null;
            const cost = blockUnits(b);
            const shown = Math.min(cost, budget);
            budget -= cost;
            const key = `${t.id}-${i}`;
            if (b.kind === 'text')
              return (
                <p key={key} className={p.text}>
                  {b.text.split(' ').slice(0, shown).join(' ')}
                </p>
              );
            if (b.kind === 'custom') return <div key={key}>{b.render({ send, busy: !!working })}</div>;
            if (b.kind === 'suggest')
              return (
                <div key={key} className={p.followUps}>
                  {(b.prompts as unknown as Prompt[]).map((q) => (
                    <button key={q.text} type="button" className={p.followUp} onClick={() => send(q.text)}>
                      <TopicLabel topic={q.topic} />
                      {q.text}
                    </button>
                  ))}
                </div>
              );
            return null;
          })}
        {t.stopped && <p className={p.stopped}>Stopped</p>}
      </div>
    );
  };

  if (!open) return null;

  return (
    <aside ref={panelRef} className={clsx(p.panel, className)} aria-label="Agent">
      <header className={p.head}>
        {headTitle}
        <span className={p.headActions}>
          {onOpenInAiSearch && (
            <button
              type="button"
              className={s.aiSearchBtn}
              aria-disabled={!canOpenInAiSearch}
              onClick={openInAiSearch}
              aria-label="Open in AI agent chat (new tab)"
              title={
                canOpenInAiSearch
                  ? 'Open this chat in AI agent chat (new tab)'
                  : 'Ask something first, then continue in AI agent chat'
              }
            >
              <AiSearchIcon size={16} />
              <span className={s.aiSearchLabel}>AI agent chat</span>
            </button>
          )}
          {headExtra}
          {turns.length > 0 && (
            <button type="button" className={p.iconBtn} onClick={newChat} aria-label="New chat" title="New chat">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M11.5 2.5l2 2L8 10H6V8l5.5-5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </button>
          )}
          <button type="button" className={p.iconBtn} onClick={onClose} aria-label="Close agent" title="Close (Esc)">
            <CloseIcon />
          </button>
        </span>
      </header>

      {/* The member stays in the panel with the chat intact (ticket scenario 3). */}
      {handoffFailed && (
        <div className={s.handoffError} role="alert">
          <WarningCircle weight="regular" aria-hidden />
          <span className={s.handoffErrorText}>Couldn’t open this chat in AI agent chat.</span>
          <button type="button" className={s.handoffRetry} onClick={openInAiSearch}>
            Retry
          </button>
          <button
            type="button"
            className={p.iconBtn}
            onClick={() => setHandoffFailed(false)}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <div ref={threadRef} className={p.thread}>
        {turns.length === 0 ? (
          <div className={p.empty}>
            <h2 className={p.hello}>{greeting}</h2>
            <p className={p.helloSub}>{intro}</p>
            <ul className={p.prompts}>
              {prompts.map((q) => (
                <li key={q.text}>
                  <button
                    type="button"
                    className={clsx(p.prompt, q.primary && p.promptPrimary)}
                    onClick={() => send(q.text)}
                  >
                    <TopicLabel topic={q.topic} />
                    {q.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((t) =>
            t.role === 'user' ? (
              <div key={t.id} className={p.userTurn}>
                {t.text}
              </div>
            ) : (
              renderAgent(t)
            ),
          )
        )}
      </div>

      <div className={clsx(p.foot, s.foot)}>
        {picker && (
          <ContextPicker
            mode={picker.mode}
            query={picker.query}
            groups={groups}
            active={flat[Math.min(active, flat.length - 1)]?.id}
            onQuery={(q) => setPicker({ mode: 'plus', query: q, start: 0 })}
            onKeyDown={pickerKeys}
            onHover={(id) => setActive(flat.findIndex((f) => f.id === id))}
            onPick={pick}
          />
        )}

        <div className={corner.contextRow} aria-label="What the agent reads">
          <PageSlot
            page={page}
            readable={pageReadable}
            attached={reading.some((r) => r.id === page.id)}
            onRemove={() => onRemove(page.id)}
            onAddBack={() => onAdd(page)}
          />
          {reading.filter((r) => r.id !== page.id).map((r) => (
            <span key={r.id} className={corner.contextChip} title={`The agent reads ${r.label}`}>
              <ItemGlyph item={r} />
              <span className={clsx(corner.contextLabel, s.chipLabel)}>{r.label}</span>
              <button
                type="button"
                className={corner.contextRemove}
                aria-label={`Stop reading ${r.label}`}
                onClick={() => onRemove(r.id)}
              >
                <X weight="bold" />
              </button>
            </span>
          ))}
          <button
            type="button"
            className={corner.contextAdd}
            aria-expanded={picker?.mode === 'plus'}
            data-popup-open={picker?.mode === 'plus' ? '' : undefined}
            onClick={() => setPicker((cur) => (cur?.mode === 'plus' ? null : { mode: 'plus', query: '', start: 0 }))}
            title="Add a page, story, team or member (or type @)"
          >
            <Plus weight="bold" />
            {reading.length === 0 ? 'Add context' : 'Add'}
          </button>
        </div>

        <Composer
          ref={inputRef}
          className={p.composer}
          rows={1}
          placeholder={placeholder}
          aria-label="Message the agent"
          onTextSubmit={() => send(inputRef.current?.value ?? '')}
          onStopStreaming={stop}
          isLoadingObject={!!working}
          onChange={(e) => readMention(e.currentTarget)}
          onKeyDown={(e) => {
            if (pickerKeys(e)) return;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e.currentTarget.value);
            }
          }}
        />
      </div>
    </aside>
  );
}

/**
 * The page the member is on, in the context row's first slot (LAB-3389: "make it clear the current page is
 * attached as context"). The slot never moves; only its state changes, so the three states read against each
 * other (the state and the press that sets it in one place, design-thinking lesson 40):
 *
 *   attached    [glyph] Context  Maya Okonkwo  ✕   the context chip, with "Context" saying what the chip IS
 *   removed     [glyph] Not in context  Maya Okonkwo  +   the same chip in the dashed add lineage ("+ Add" wears
 *                                                     it); the whole chip is one press that puts the page back.
 *                                                     It keeps the page's name, so it can't read as a second
 *                                                     "Add context" door beside the real one.
 *   unreadable  [lock] Can't read this page        no ✕, no add, no hover (label lineage): nothing to press
 */
function PageSlot({
  page,
  readable,
  attached,
  onRemove,
  onAddBack,
}: {
  page: AgentItem;
  readable: boolean;
  attached: boolean;
  onRemove: () => void;
  onAddBack: () => void;
}) {
  if (!readable)
    return (
      <span
        className={clsx(corner.contextChip, s.pageChipLocked)}
        title={`The agent can’t read ${page.label}: settings and messages stay private. Ask anyway, or add something with +.`}
      >
        <LockSimple weight="regular" aria-hidden />
        <span className={corner.contextLabel}>Can’t read this page</span>
      </span>
    );
  if (!attached)
    return (
      <button
        type="button"
        className={clsx(corner.contextAdd, s.pageAddBack)}
        onClick={onAddBack}
        aria-label={`Let the agent read ${page.label} again`}
        title={`Let the agent read ${page.label} again`}
      >
        <ItemGlyph item={page} />
        <span className={s.pageChipKicker}>Not in context</span>
        <span className={clsx(corner.contextLabel, s.chipLabel)}>{page.label}</span>
        <Plus weight="bold" className={s.pageAddPlus} />
      </button>
    );
  return (
    <span className={clsx(corner.contextChip, s.pageChip)} title={`The agent reads ${page.label} with every question`}>
      <ItemGlyph item={page} />
      <span className={s.pageChipKicker}>Context</span>
      <span className={clsx(corner.contextLabel, s.chipLabel)}>{page.label}</span>
      <button
        type="button"
        className={corner.contextRemove}
        aria-label={`Stop reading ${page.label}`}
        title="Stop reading this page"
        onClick={onRemove}
      >
        <X weight="bold" />
      </button>
    </span>
  );
}

/**
 * One picker for both doors. Grouped by kind, in the order the agent is most often pointed at (pages, then
 * news, teams, members, events, forum). From "+", it has its own search field; from "@", the composer is the
 * search field. Arrows + Enter pick; Esc closes.
 */
function ContextPicker({
  mode,
  query,
  groups,
  active,
  onQuery,
  onKeyDown,
  onHover,
  onPick,
}: {
  mode: 'at' | 'plus';
  query: string;
  groups: { kind: AgentItemKind; items: AgentItem[] }[];
  active?: string;
  onQuery: (q: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => boolean;
  onHover: (id: string) => void;
  onPick: (item: AgentItem) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div className={clsx(menu.popup, s.picker)} role="dialog" aria-labelledby="agent-picker-title">
      <div id="agent-picker-title" className={s.pickerTitle}>
        Add context
      </div>
      {mode === 'plus' ? (
        <input
          autoFocus
          className={s.pickerSearch}
          placeholder="Search pages, news, teams, members…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => onKeyDown(e)}
          aria-label="Search what to add"
        />
      ) : (
        <div className={s.pickerHint}>{query ? `Matching “${query}”` : 'Mention a page, story, team or member'}</div>
      )}
      <div ref={listRef} className={s.pickerList} role="listbox">
        {groups.length === 0 && <p className={s.pickerEmpty}>Nothing matches “{query}”.</p>}
        {groups.map((g) => (
          <div key={g.kind} role="group" aria-label={KIND_LABEL[g.kind]}>
            <div className={clsx(menu.popupTitle, s.pickerGroup)}>
              {g.kind === 'page' ? 'Pages' : KIND_LABEL[g.kind]}
            </div>
            {g.items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={active === item.id}
                data-active={active === item.id}
                className={clsx(menu.item, corner.pageItem, s.pickerItem)}
                onMouseEnter={() => onHover(item.id)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(item)}
              >
                <ItemGlyph item={item} />
                <span className={clsx(corner.pageItemText, s.pickerText)}>
                  <span className={s.pickerLabel}>{item.label}</span>
                  <span className={corner.pageItemKind}>{item.meta}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
