'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import { ArrowBackIcon, CloseIcon } from '@/components/icons';
import ChatInput from '@/components/page/husky/chat-input';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

// Production / ai-search stylesheets, so the rows are the rows already drawn.
import tt from '@/components/core/application-search/components/TryToSearch/TryToSearch.module.scss';
import shell from '../nav-shared/PrototypeSearchModal.module.scss';
import sf from '../ai-search/SearchField.module.scss';
import av from '../ai-search/AiSearchView.module.scss';

import { AnswerPanel, makeTurn, type Turn } from '../ai-search/AnswerPanel';
import { QuerySuggestions } from '../ai-search/QuerySuggestions';
import { suggestQuestions } from '../ai-search/suggestions';
import { FOUNDER_PROMPTS, SUGGESTED_PROMPTS } from '../ai-search/mocks';
import { useAiSearchViewer } from '../ai-search/viewer';
import type { AiSearchScope } from '../ai-search/scope';

import { HistoryList } from './HistoryList';
import { ClockGlyph, PanelGlyph, PlusGlyph } from './icons';
import { newThreadId, threadTitle, type ChatThread } from './threads';
import s from './AiMode.module.scss';

/** What the host asks the surface to do as it opens (or while it is open). */
export interface AiModeRequest {
  nonce: number;
  /** Ask this at once, as a new thread. */
  question?: string;
  /** New chat about a team or person (a result row's "Ask AI"). */
  scope?: AiSearchScope | null;
  /** Reopen this past thread (the popover's recent chats). */
  threadId?: number;
  /** Open with the history showing (the popover's "All chats"). */
  showHistory?: boolean;
}

export type AiModeFrame = 'page' | 'modal';

interface AiModeSurfaceProps {
  /**
   * `page`: AI Search is a page under the header — rail open, a Back to search
   * in the page bar. `modal`: the alternative still on the table — the same
   * surface in the ai-search takeover, rail collapsed until asked for, ✕ to
   * close.
   */
  frame: AiModeFrame;
  /** Whether the mode is showing. The page stays mounted while hidden. */
  open?: boolean;
  onClose?: () => void;
  threads: ChatThread[];
  onThreadsChange: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  activeId: number | null;
  onActiveIdChange: (id: number | null) => void;
  request: AiModeRequest | null;
  /** What was typed in the header search, which Back to search returns to. */
  term: string;
  onBackToSearch: () => void;
}

const COMPOSER_ID = 'ai-mode-composer';
/** The modal's rail lists this many before "Show all history". */
const MODAL_RAIL_ROWS = 5;

/**
 * AI Search as one mode with a home of its own.
 *
 * Production has three AI surfaces — the search overlay's AI column, the
 * header's AI dialog, and /husky/chat, which exists mainly so a person can
 * find their past chats. Decision direction (Sep 28 standup, LAB-2702): two.
 * General search stays a popover under the header field; everything AI is
 * one **mode**, like Google Search → AI Mode, and it lives on a page, at
 * /ai-search (renamed from /husky: the product calls the feature AI Search
 * everywhere a person reads it, and "Husky" is a code name).
 *
 * The page answers the one question the brief says people can't: *where did
 * my chat go?* History is not behind a toggle or a "Show all" — it is the
 * page's left rail, labelled History, the same place every chat product the
 * reader has used keeps it (ChatGPT, Gemini, Perplexity, Google's own AI
 * Mode). The general search popover signposts it too: its idle state lists the
 * latest chats with an "All chats" door that lands here with the rail open.
 *
 * Layout:
 *  - **rail** (272px, ⌘B collapses it to a 56px strip of the same three
 *    doors, production's shortcut): AI Search name, New chat, History grouped
 *    by production's date buckets, delete on hover with production's confirm.
 *  - **page bar**: "Back to search" with the term you left, the way out of
 *    the mode. It reopens the header search with that term in it — the mode is
 *    the thing you leave, never the words.
 *  - **new chat**: the composer is the page — AI mark, name, one sentence of
 *    scope, the input, then "Try asking" (suggestions while you type).
 *  - **thread**: the ai-search entry's `AnswerPanel` (answer, directory cards,
 *    sources, follow-ups, thumbs), in a centred reading column, its own input
 *    as the footer.
 *
 * Below tablet-landscape the rail is a drawer from the left, opened from a
 * labelled History button in the page bar, and New chat moves into that bar
 * too so starting over never needs the drawer.
 */
export function AiModeSurface({
  frame,
  open = true,
  onClose,
  threads,
  onThreadsChange,
  activeId,
  onActiveIdChange,
  request,
  term,
  onBackToSearch,
}: AiModeSurfaceProps) {
  const viewer = useAiSearchViewer();
  const isModal = frame === 'modal';

  /* The page opens with its history in view; the modal keeps it tucked, which
     is the alternative being compared. */
  const [railOpen, setRailOpen] = useState(!isModal);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAllInModal, setShowAllInModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  /** The scope the next new chat is asked in (a row's "Ask AI"); removable. */
  const [newChatScope, setNewChatScope] = useState<AiSearchScope | null>(null);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const focusComposer = () => requestAnimationFrame(() => document.getElementById(COMPOSER_ID)?.focus());

  /* ---------------------------------------------------------------------- */
  /* Threads                                                                  */
  /* ---------------------------------------------------------------------- */

  const startThread = useCallback(
    (question: string, scope: AiSearchScope | null) => {
      const text = question.trim();
      if (!text) return;
      const thread: ChatThread = {
        id: newThreadId(),
        createdAt: new Date(),
        scope,
        turns: [makeTurn(text, scope, viewer)],
      };
      onThreadsChange((prev) => [thread, ...prev]);
      onActiveIdChange(thread.id);
      setNewChatScope(null);
    },
    [onThreadsChange, onActiveIdChange, viewer],
  );

  const setTurns = useCallback(
    (next: Turn[] | ((prev: Turn[]) => Turn[])) => {
      onThreadsChange((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, turns: typeof next === 'function' ? next(t.turns) : next } : t)),
      );
    },
    [activeId, onThreadsChange],
  );

  const followUp = useCallback(
    (q: string) => setTurns((prev) => [...prev, makeTurn(q, active?.scope ?? null, viewer)]),
    [setTurns, active, viewer],
  );

  const newChat = useCallback(() => {
    onActiveIdChange(null);
    setNewChatScope(null);
    setDrawerOpen(false);
    focusComposer();
  }, [onActiveIdChange]);

  const openThread = (id: number) => {
    onActiveIdChange(id);
    setDrawerOpen(false);
  };

  const toDelete = threads.find((t) => t.id === deleteId);
  const deleteTitle = toDelete ? threadTitle(toDelete) : '';

  const confirmDelete = () => {
    if (deleteId == null) return;
    onThreadsChange((prev) => prev.filter((t) => t.id !== deleteId));
    if (deleteId === activeId) onActiveIdChange(null);
    setDeleteId(null);
  };

  /* What the host asked for, once per request. */
  useEffect(() => {
    if (!request) return;
    if (request.question) startThread(request.question, request.scope ?? null);
    else if (request.threadId != null) onActiveIdChange(request.threadId);
    else {
      onActiveIdChange(null);
      setNewChatScope(request.scope ?? null);
      focusComposer();
    }
    if (request.showHistory) {
      setRailOpen(true);
      setShowAllInModal(true);
      /* Below tablet-landscape the rail is the drawer. */
      if (window.innerWidth < 960) setDrawerOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  /* ⌘B / Ctrl+B — production's own rail shortcut ("to expand/collapse"). */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setRailOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ---------------------------------------------------------------------- */
  /* Drafts: unsent text is kept per thread, and for the new chat               */
  /* ---------------------------------------------------------------------- */

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftKey = activeId == null ? 'new' : String(activeId);
  const setDraft = useCallback((text: string) => setDrafts((prev) => ({ ...prev, [draftKey]: text })), [draftKey]);

  /* ---------------------------------------------------------------------- */
  /* Rail                                                                     */
  /* ---------------------------------------------------------------------- */

  const historyList = (inDrawer: boolean) => (
    <HistoryList
      threads={threads}
      activeId={activeId}
      onOpen={openThread}
      onDelete={setDeleteId}
      limit={isModal && !showAllInModal && !inDrawer ? MODAL_RAIL_ROWS : undefined}
      onShowAll={() => setShowAllInModal(true)}
    />
  );

  const railBody = (inDrawer: boolean) => (
    <>
      <div className={s.railHead}>
        <span className={s.modeName}>
          <AiSearchIcon size={20} />
          AI Search
        </span>
        {inDrawer ? (
          <button type="button" className={s.iconBtn} onClick={() => setDrawerOpen(false)} aria-label="Close history">
            <CloseIcon width={16} height={16} />
          </button>
        ) : (
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => setRailOpen(false)}
            aria-label="Collapse history"
            title="Collapse (⌘B)"
          >
            <PanelGlyph />
          </button>
        )}
      </div>
      <button type="button" className={s.newChat} onClick={newChat}>
        <PlusGlyph />
        New chat
      </button>
      <div className={s.historyHead}>
        <ClockGlyph />
        History
      </div>
      <div className={s.railScroll}>{historyList(inDrawer)}</div>
    </>
  );

  /* The rail at 56px keeps the same three doors, as glyphs, in the same order. */
  const railCollapsed = (
    <div className={s.railStrip}>
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => setRailOpen(true)}
        aria-label="Expand history"
        title="Expand (⌘B)"
      >
        <PanelGlyph />
      </button>
      <button
        type="button"
        className={clsx(s.iconBtn, s.iconBtnBrand)}
        onClick={newChat}
        aria-label="New chat"
        title="New chat"
      >
        <PlusGlyph />
      </button>
      <button
        type="button"
        className={s.iconBtn}
        onClick={() => {
          setRailOpen(true);
          setShowAllInModal(true);
        }}
        aria-label="Show history"
        title="History"
      >
        <ClockGlyph />
      </button>
    </div>
  );

  /* ---------------------------------------------------------------------- */
  /* Main column                                                              */
  /* ---------------------------------------------------------------------- */

  const pageBar = (
    <div className={s.pageBar}>
      <button type="button" className={s.back} onClick={onBackToSearch}>
        <ArrowBackIcon width={16} height={16} />
        <span className={s.backLabel}>Back to search</span>
        {/* The words you left with. They go back into the header field. */}
        {term && <span className={s.backTerm}>&ldquo;{term}&rdquo;</span>}
      </button>

      <div className={s.pageBarEnd}>
        {/* Phones: the rail is a drawer, so its two doors come up here —
            History labelled, because "where are my chats" is the question
            this page exists to answer, and a bare glyph doesn't. */}
        <button type="button" className={clsx(s.barBtn, s.mobileOnly)} onClick={() => setDrawerOpen(true)}>
          <ClockGlyph />
          History
        </button>
        {activeId != null && (
          <button
            type="button"
            className={clsx(s.iconBtn, s.iconBtnBrand, s.mobileOnly)}
            onClick={newChat}
            aria-label="New chat"
          >
            <PlusGlyph />
          </button>
        )}
        {isModal && onClose && (
          <button type="button" className={sf.close} onClick={onClose} aria-label="Close AI Search">
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );

  const main = (
    <div className={s.main}>
      {pageBar}
      {active ? (
        <div className={s.thread}>
          <AnswerPanel
            key={active.id}
            layout="page"
            hideBar
            turns={active.turns}
            onTurnsChange={setTurns}
            onAsk={followUp}
            draft={drafts[draftKey] ?? ''}
            onDraftChange={setDraft}
            onOpenTarget={active.scope ? (target) => active.scope!.onOpen(target) : undefined}
          />
        </div>
      ) : (
        <NewChat
          key={`new-${request?.nonce ?? 0}`}
          scope={newChatScope}
          onRemoveScope={() => {
            setNewChatScope(null);
            focusComposer();
          }}
          onAsk={(q) => {
            setDraft('');
            startThread(q, newChatScope);
          }}
          draft={drafts.new ?? ''}
          onDraftChange={(text) => setDrafts((prev) => ({ ...prev, new: text }))}
        />
      )}
    </div>
  );

  const surface = (
    <div className={clsx(s.surface, isModal && s.surfaceModal)}>
      <aside className={clsx(s.rail, !railOpen && s.railIsCollapsed)} aria-label="AI Search history">
        {railOpen ? railBody(false) : railCollapsed}
      </aside>
      {main}

      {/* Phones: the same rail, as a sheet from the left. */}
      <div
        className={clsx(s.drawerScrim, drawerOpen && s.drawerScrimOpen)}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={clsx(s.drawer, drawerOpen && s.drawerOpen)}
        aria-label="AI Search history"
        aria-hidden={!drawerOpen}
      >
        {railBody(true)}
      </aside>

      <ConfirmDialog
        isOpen={deleteId != null}
        title="Delete chat?"
        desc={`“${deleteTitle}” will be removed from your history.`}
        confirmTitle="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );

  /* The page stays mounted while you are back on search, so a half-typed
     question and the rail's state are there when you return. */
  if (!isModal) return <div hidden={!open}>{surface}</div>;

  return (
    <Modal isOpen={open} onClose={onClose} overlayClassname={shell.overlay} className={shell.container} lockScroll>
      <div className={shell.card} role="dialog" aria-modal="true" aria-label="AI Search">
        {surface}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------ */
/* New chat                                                                   */
/* ------------------------------------------------------------------------ */

interface NewChatProps {
  scope: AiSearchScope | null;
  onRemoveScope: () => void;
  onAsk: (question: string) => void;
  draft: string;
  onDraftChange: (text: string) => void;
}

/**
 * The mode's front page: the composer is the page. Name, one line of what the
 * answers come from (or, scoped, what removing the chip widens to), the input,
 * then the offer — "Try asking" — which yields its rows to matching questions
 * while you type (the ai-search view's rule). History is not repeated here:
 * the rail beside it is where it lives, and a second list of it one column
 * over is the same record twice.
 */
function NewChat({ scope, onRemoveScope, onAsk, draft, onDraftChange }: NewChatProps) {
  const viewer = useAiSearchViewer();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [live, setLive] = useState(draft);

  const suggestions = useMemo(() => suggestQuestions(live, { viewer, pool: scope?.prompts }), [live, viewer, scope]);
  const prompts =
    scope?.prompts ?? (viewer === 'founder' ? [...FOUNDER_PROMPTS, ...SUGGESTED_PROMPTS] : SUGGESTED_PROMPTS);

  /* A restored draft comes back at its own height (ChatInput only sizes on a keystroke). */
  useEffect(() => {
    const el = inputRef.current;
    if (!el || !el.value) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 1}px`;
  }, []);

  const submit = (text?: string) => {
    const value = (text ?? inputRef.current?.value ?? '').trim();
    if (!value) return;
    onAsk(value);
  };

  return (
    <div className={s.newChatPage}>
      <div className={s.newChatColumn}>
        <div className={s.hero}>
          <AiSearchIcon size={32} />
          <h1 className={s.heroTitle}>AI Search</h1>
          <p className={s.heroLine}>
            {scope
              ? `Answers come from the ${scope.name} profile. Remove it to ask the whole network.`
              : 'Answers come from the directory: members, teams, projects, events and forum posts.'}
          </p>
        </div>

        {scope && (
          <span className={clsx(sf.scopeChip, av.titleChip, s.scopeChip)}>
            <img
              className={clsx(sf.scopeLogo, scope.kind === 'member' && sf.scopeLogoPerson)}
              src={scope.logo}
              alt=""
              width={16}
              height={16}
            />
            <span className={sf.scopeName}>About {scope.name}</span>
            <button
              type="button"
              className={sf.scopeRemove}
              onClick={onRemoveScope}
              aria-label={`Remove ${scope.name}, ask the whole network`}
            >
              <CloseIcon width={12} height={12} />
            </button>
          </span>
        )}

        <form className={s.composer} onSubmit={(e) => e.preventDefault()}>
          <ChatInput
            ref={inputRef}
            id={COMPOSER_ID}
            placeholder={scope ? `Ask about ${scope.name}` : 'Ask AI Search a question'}
            rows={1}
            defaultValue={draft}
            onChange={(e) => {
              setLive(e.target.value);
              onDraftChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                e.preventDefault();
                submit();
              }
            }}
            onTextSubmit={() => submit()}
          />
        </form>

        {suggestions.length > 0 ? (
          <div className={clsx(tt.root, s.prompts)}>
            <div className={tt.label}>Suggestions</div>
            <QuerySuggestions
              suggestions={suggestions}
              query={live}
              onPick={submit}
              variant="prompts"
              idPrefix="ai-mode-suggestion"
            />
          </div>
        ) : (
          <div className={clsx(tt.root, s.prompts)}>
            <div className={tt.label}>Try asking</div>
            <ul className={tt.list}>
              {prompts.map((p) => (
                <li key={p.text}>
                  <button
                    type="button"
                    className={clsx(tt.suggestionButton, av.promptButton)}
                    onClick={() => submit(p.text)}
                  >
                    <img src={p.icon} alt="" className={av.promptIcon} />
                    {p.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
