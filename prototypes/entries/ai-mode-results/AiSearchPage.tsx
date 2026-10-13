'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';

import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/core/ConfirmDialog';
import { toast } from '@/components/core/ToastContainer';
import { ArrowBackIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { ShareIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu/components/Icons';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

// Production / sibling-entry stylesheets, so rows are the rows already drawn.
import tt from '@/components/core/application-search/components/TryToSearch/TryToSearch.module.scss';
import menu from '@/components/page/home/TeamNews/components/NewsShareMenu/NewsShareMenu.module.scss';
import lm from '../job-board/ListingMenu.module.scss';
import av from '../ai-search/AiSearchView.module.scss';
import am from '../ai-mode/AiMode.module.scss';
import sf from '../ai-search/SearchField.module.scss';
// The glossy primary the navbar's Sign in wears (see follow-shared).
import fb from '../follow-shared/FollowButton.module.scss';

import { AnswerPanel as CurrentAnswerPanel, makeTurn, type Turn } from '../ai-search/AnswerPanel';
import { ProposedAnswerPanel } from './proposed/ProposedAnswerPanel';
import { QuerySuggestions } from '../ai-search/QuerySuggestions';
import { suggestQuestions } from '../ai-search/suggestions';
import { SUGGESTED_PROMPTS } from '../ai-search/mocks';
import { HistoryList } from '../ai-mode/HistoryList';
import { ClockGlyph, PanelGlyph, PlusGlyph } from '../ai-mode/icons';
import { newThreadId, threadTitle, type ChatThread } from '../ai-mode/threads';
import type { AiModeRequest } from '../ai-mode/AiModeSurface';
import type { AiSearchScope } from '../ai-search/scope';
import { DotsIcon } from '../news-shared/icons';
import { DeleteIcon } from '../job-board/icons';

import { threadUrl, titleFor, type SharedChat } from './mocks';
import Composer from './Composer';
import s from './AiSearchPage.module.scss';

const COMPOSER_ID = 'ai-search-page-composer';
/** The rail offers Search chats once there is more history than a glance holds. */
const SEARCH_FROM = 6;

interface AiSearchPageProps {
  signedIn: boolean;
  /** Signed in: the saved history. Signed out: this session's chats, kept nowhere. */
  threads: ChatThread[];
  onThreadsChange: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  activeId: number | null;
  onActiveIdChange: (id: number | null) => void;
  /** Someone else's chat, opened from its link. Read until you ask a follow-up. */
  shared: SharedChat | null;
  onSharedChange: (next: SharedChat | null) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  /**
   * Hosted as AI Search mode (the ai-mode entry): what the header search asked
   * for as the page opened — a question, a past chat, "All chats", or a row's
   * Ask AI scope. Applied once per nonce.
   */
  request?: AiModeRequest | null;
  /** Hosted as a mode: the way back to the header search, with the term you left. */
  onBackToSearch?: () => void;
  term?: string;
  /** False while the host keeps the page mounted but hidden (⌘B stays off). */
  open?: boolean;
  /**
   * ai-mode-results: which answer components draw the thread. `current` is the
   * ai-search AnswerPanel every other entry uses; `proposed` is this entry's
   * refresh (see PROPOSAL.md). Same props, same turns, so the switch swaps
   * only the drawing.
   */
  answers?: 'current' | 'proposed';
}

/**
 * Production's /husky page, kept and refactored — not replaced.
 *
 * The skeleton is production's `app/husky/layout.tsx` + `chat/page.tsx`: a
 * 300px history sidebar that ⌘B collapses to 64px (`sidebar.tsx`'s own
 * widths and shortcut, and its footer hint), the new-chat page with the
 * banner and centred headline (`chat-home.tsx`), and a thread with its input
 * pinned to the bottom (`chat.tsx`). What changes is listed in `mocks.ts →
 * CHANGES` and in the review band; each change is commented where it lives.
 *
 * Google Search's AI Mode is the reference for what the page is *for* — one
 * place for asking, with every past chat beside it and a link per chat — and
 * the reason the refactor adds a title bar with Share: a chat on a page has a
 * URL, and a URL is the thing people pass around.
 */
export function AiSearchPage({
  signedIn,
  threads,
  onThreadsChange,
  activeId,
  onActiveIdChange,
  shared,
  onSharedChange,
  onSignIn,
  onSignUp,
  request,
  onBackToSearch,
  term,
  open = true,
  answers = 'proposed',
}: AiSearchPageProps) {
  const AnswerPanel = answers === 'proposed' ? ProposedAnswerPanel : CurrentAnswerPanel;
  const [railOpen, setRailOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /** The scope the next new chat is asked in (a result row's Ask AI); removable. */
  const [newChatScope, setNewChatScope] = useState<AiSearchScope | null>(null);

  const active = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);
  /* What the main column shows: a shared chat wins while it is open. */
  const shown = shared?.thread ?? active;

  /* Opening a chat brings the whole page under the header, so the input at
     its foot is on screen (the review band above scrolls away first). */
  const pageRef = useRef<HTMLDivElement>(null);
  const shownId = shown?.id ?? null;
  useEffect(() => {
    if (shownId != null) pageRef.current?.scrollIntoView({ block: 'start' });
  }, [shownId]);

  const focusComposer = () => requestAnimationFrame(() => document.getElementById(COMPOSER_ID)?.focus());

  /* ---------------------------------------------------------------------- */
  /* Threads                                                                  */
  /* ---------------------------------------------------------------------- */

  const startThread = useCallback(
    (question: string, scope: AiSearchScope | null = null) => {
      const text = question.trim();
      if (!text) return;
      const thread: ChatThread = {
        id: newThreadId(),
        createdAt: new Date(),
        scope,
        title: titleFor(text),
        turns: [makeTurn(text, scope)],
      };
      onThreadsChange((prev) => [thread, ...prev]);
      onSharedChange(null);
      onActiveIdChange(thread.id);
      setNewChatScope(null);
    },
    [onThreadsChange, onActiveIdChange, onSharedChange],
  );

  const setTurns = useCallback(
    (next: Turn[] | ((prev: Turn[]) => Turn[])) => {
      const apply = (turns: Turn[]) => (typeof next === 'function' ? next(turns) : next);
      if (shared) {
        onSharedChange({ ...shared, thread: { ...shared.thread, turns: apply(shared.thread.turns) } });
        return;
      }
      onThreadsChange((prev) => prev.map((t) => (t.id === activeId ? { ...t, turns: apply(t.turns) } : t)));
    },
    [activeId, onThreadsChange, shared, onSharedChange],
  );

  /**
   * A follow-up on someone else's chat makes it yours: a copy of what was
   * asked so far, plus the new question, lands at the top of History and the
   * page moves to it. Production gets there through a black "Continue
   * Conversation" bar that replaces the input — one press more, and the
   * input the reader came to use is the thing hidden.
   */
  const followUp = useCallback(
    (q: string) => {
      if (shared) {
        const copy: ChatThread = {
          id: newThreadId(),
          createdAt: new Date(),
          scope: null,
          title: shared.thread.title,
          turns: [...shared.thread.turns, makeTurn(q)],
        };
        onThreadsChange((prev) => [copy, ...prev]);
        onSharedChange(null);
        onActiveIdChange(copy.id);
        toast.success(signedIn ? 'Saved a copy to your history' : 'Started your own copy of this chat');
        return;
      }
      setTurns((prev) => [...prev, makeTurn(q, active?.scope ?? null)]);
    },
    [shared, setTurns, onThreadsChange, onSharedChange, onActiveIdChange, signedIn, active],
  );

  const newChat = useCallback(() => {
    onSharedChange(null);
    onActiveIdChange(null);
    setNewChatScope(null);
    setDrawerOpen(false);
    focusComposer();
  }, [onActiveIdChange, onSharedChange]);

  const openThread = (id: number) => {
    onSharedChange(null);
    onActiveIdChange(id);
    setDrawerOpen(false);
  };

  const toDelete = threads.find((t) => t.id === deleteId);
  const confirmDelete = () => {
    if (deleteId == null) return;
    onThreadsChange((prev) => prev.filter((t) => t.id !== deleteId));
    if (deleteId === activeId) onActiveIdChange(null);
    setDeleteId(null);
  };

  const share = async (thread: ChatThread) => {
    try {
      await navigator.clipboard.writeText(threadUrl(thread.id));
    } catch {
      /* Clipboard is blocked in some previews; the toast still tells the story. */
    }
    toast.success('Link copied. Anyone with it can read this chat.');
  };

  /* What the mode's host asked for, once per request. */
  useEffect(() => {
    if (!request) return;
    onSharedChange(null);
    if (request.question) startThread(request.question, request.scope ?? null);
    else if (request.threadId != null) onActiveIdChange(request.threadId);
    else {
      onActiveIdChange(null);
      setNewChatScope(request.scope ?? null);
      focusComposer();
    }
    if (request.showHistory) {
      setRailOpen(true);
      /* Below tablet-landscape the rail is the drawer. */
      if (window.innerWidth < 960) setDrawerOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  /* ⌘B / Ctrl+B — production's rail shortcut, and its footer says so. */
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

  const draftKey = shown ? String(shown.id) : 'new';
  const setDraft = useCallback((text: string) => setDrafts((prev) => ({ ...prev, [draftKey]: text })), [draftKey]);

  /* ---------------------------------------------------------------------- */
  /* Rail                                                                     */
  /* ---------------------------------------------------------------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? threads.filter((t) => threadTitle(t).toLowerCase().includes(q)) : threads;
  }, [threads, query]);

  const history = (
    <>
      {signedIn && threads.length >= SEARCH_FROM && (
        <label className={s.search}>
          <SearchIcon width={14} height={14} className={s.searchIcon} />
          <input
            className={s.searchInput}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
          />
          {query && (
            <button type="button" className={s.searchClear} onClick={() => setQuery('')} aria-label="Clear search">
              <CloseIcon width={12} height={12} />
            </button>
          )}
        </label>
      )}

      {signedIn ? (
        <div className={am.historyHead}>
          <ClockGlyph />
          History
        </div>
      ) : (
        threads.length > 0 && (
          <div className={am.historyHead}>
            <ClockGlyph />
            This visit
          </div>
        )
      )}

      <div className={am.railScroll}>
        {query && filtered.length === 0 ? (
          <p className={am.historyEmpty}>No chats match &ldquo;{query.trim()}&rdquo;.</p>
        ) : signedIn || threads.length > 0 ? (
          <HistoryList
            threads={filtered}
            activeId={shared ? null : activeId}
            onOpen={openThread}
            onDelete={setDeleteId}
            /* Signed out there is nothing to group: it is all this visit. */
            limit={signedIn ? undefined : filtered.length}
          />
        ) : null}

        {!signedIn && (
          /* Production hides the whole sidebar when signed out, so a guest's
             chats disappear without a word. The rail stays and says why they
             will: both doors, in the navbar's order and ranking. */
          <div className={s.keep}>
            <p className={s.keepTitle}>Sign in to keep your chats</p>
            <p className={s.keepBody}>
              Chats you start signed out are gone when you leave. Signed in, every chat is kept here with its own link.
            </p>
            <div className={s.keepActions}>
              <Button size="s" style="border" variant="neutral" onClick={onSignUp}>
                Sign up
              </Button>
              <Button size="s" className={fb.glossy} onClick={onSignIn}>
                Sign in
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const railBody = (inDrawer: boolean) => (
    <>
      <div className={am.railHead}>
        <span className={am.modeName}>
          <AiSearchIcon size={20} />
          AI Search
        </span>
        {inDrawer && (
          <button type="button" className={am.iconBtn} onClick={() => setDrawerOpen(false)} aria-label="Close history">
            <CloseIcon width={16} height={16} />
          </button>
        )}
      </div>
      <button type="button" className={am.newChat} onClick={newChat}>
        <PlusGlyph />
        New chat
      </button>
      {history}
      {!inDrawer && (
        /* Production's footer, kept: the shortcut is taught where the toggle is. */
        <div className={s.railFoot}>
          <span className={s.shortcut}>
            <kbd className={s.key}>⌘</kbd>+<kbd className={s.key}>B</kbd>
            to collapse
          </span>
          <button
            type="button"
            className={am.iconBtn}
            onClick={() => setRailOpen(false)}
            aria-label="Collapse history"
            title="Collapse (⌘B)"
          >
            <PanelGlyph />
          </button>
        </div>
      )}
    </>
  );

  /* 64px, production's icon width: New chat and History as glyphs, the toggle
     where the expanded rail keeps it — at the foot. */
  const railCollapsed = (
    <div className={s.strip}>
      <div className={s.stripTop}>
        <button
          type="button"
          className={clsx(am.iconBtn, am.iconBtnBrand)}
          onClick={newChat}
          aria-label="New chat"
          title="New chat"
        >
          <PlusGlyph />
        </button>
        <button
          type="button"
          className={am.iconBtn}
          onClick={() => setRailOpen(true)}
          aria-label="Show history"
          title="History"
        >
          <ClockGlyph />
        </button>
      </div>
      <button
        type="button"
        className={clsx(am.iconBtn, s.flip)}
        onClick={() => setRailOpen(true)}
        aria-label="Expand history"
        title="Expand (⌘B)"
      >
        <PanelGlyph />
      </button>
    </div>
  );

  /* Hosted as a mode: leaving it is going back to search, with the words you
     left with (they go back into the header field). It leads every bar. */
  const backButton = onBackToSearch && (
    <button type="button" className={clsx(am.back, s.back)} onClick={onBackToSearch}>
      <ArrowBackIcon width={16} height={16} />
      <span className={clsx(am.backLabel, shown && s.hideOnPhone)}>Back to search</span>
      {term && !shown && <span className={am.backTerm}>&ldquo;{term}&rdquo;</span>}
    </button>
  );

  /* ---------------------------------------------------------------------- */
  /* Title bar                                                                */
  /* ---------------------------------------------------------------------- */

  /* Production's phone header ("Threads", "New Conversation") is the only
     place a chat has actions, and desktop has none. The bar now stands on
     every width while a chat is open: the title (the rail row, readable in
     full), Share, and ⋯ → Delete. On phones it also carries History. */
  const titleBar = (
    <div className={s.titleBar}>
      {backButton && (
        <>
          {backButton}
          <span className={s.barDivider} aria-hidden="true" />
        </>
      )}
      <button type="button" className={clsx(am.barBtn, am.mobileOnly)} onClick={() => setDrawerOpen(true)}>
        <ClockGlyph />
        History
      </button>

      {shown && (
        <div className={s.titleBlock}>
          <h1 className={s.title} title={threadTitle(shown)}>
            {threadTitle(shown)}
          </h1>
          {shared && (
            <span className={s.sharedBy}>
              <img src={shared.owner.image} alt="" width={16} height={16} className={s.sharedAvatar} />
              Shared by {shared.owner.name}
              <span className={s.sharedHint}>· Ask a follow-up to make your own copy</span>
            </span>
          )}
        </div>
      )}

      <div className={s.titleActions}>
        {shown && !shared && (
          <>
            <button type="button" className={am.barBtn} onClick={() => share(shown)}>
              <ShareIcon />
              <span className={s.hideOnPhone}>Share</span>
            </button>
            <Menu.Root modal={false}>
              <Menu.Trigger className={clsx(menu.iconTrigger, lm.trigger)} aria-label="More actions for this chat">
                <DotsIcon />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={menu.positioner} side="bottom" align="end" sideOffset={6}>
                  <Menu.Popup className={menu.popup}>
                    <Menu.Item className={clsx(menu.item, lm.danger)} onClick={() => setDeleteId(shown.id)}>
                      <DeleteIcon />
                      Delete
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </>
        )}
        {shown && (
          <button
            type="button"
            className={clsx(am.iconBtn, am.iconBtnBrand, am.mobileOnly)}
            onClick={newChat}
            aria-label="New chat"
          >
            <PlusGlyph />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={s.page} ref={pageRef}>
      <aside className={clsx(s.rail, !railOpen && s.railCollapsed)} aria-label="AI Search history">
        {railOpen ? railBody(false) : railCollapsed}
      </aside>

      <div className={s.main}>
        {shown ? (
          <>
            {titleBar}
            <div className={am.thread}>
              <AnswerPanel
                key={shown.id}
                layout="page"
                hideBar
                InputComponent={Composer}
                turns={shown.turns}
                onTurnsChange={setTurns}
                onAsk={followUp}
                draft={drafts[draftKey] ?? ''}
                onDraftChange={setDraft}
              />
            </div>
          </>
        ) : (
          <>
            {/* Phones only: the way to History from the new-chat page. As a
                mode it also carries Back to search, so it shows on every width. */}
            <div className={clsx(s.titleBar, s.titleBarBare, backButton && s.titleBarBack)}>
              {backButton}
              <button
                type="button"
                className={clsx(am.barBtn, backButton && am.mobileOnly)}
                onClick={() => setDrawerOpen(true)}
              >
                <ClockGlyph />
                History
              </button>
            </div>
            <NewChat
              key={`new-${request?.nonce ?? 0}`}
              scope={newChatScope}
              onRemoveScope={() => {
                setNewChatScope(null);
                focusComposer();
              }}
              onAsk={(q) => {
                setDrafts((prev) => ({ ...prev, new: '' }));
                startThread(q, newChatScope);
              }}
              draft={drafts.new ?? ''}
              onDraftChange={(text) => setDrafts((prev) => ({ ...prev, new: text }))}
            />
          </>
        )}
      </div>

      {/* Phones: the same rail as a sheet from the left (production's
          mobile sidebar, 246px behind a scrim). */}
      <div
        className={clsx(am.drawerScrim, drawerOpen && am.drawerScrimOpen)}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={clsx(am.drawer, s.drawer, drawerOpen && am.drawerOpen)}
        aria-label="AI Search history"
        aria-hidden={!drawerOpen}
      >
        {railBody(true)}
      </aside>

      <ConfirmDialog
        isOpen={deleteId != null}
        title="Delete chat?"
        desc={`“${toDelete ? threadTitle(toDelete) : ''}” will be removed from your history, and its link will stop working.`}
        confirmTitle="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* New chat                                                                   */
/* ------------------------------------------------------------------------ */

interface NewChatProps {
  /** A result row's Ask AI: the new chat is about this team or person until removed. */
  scope: AiSearchScope | null;
  onRemoveScope: () => void;
  onAsk: (question: string) => void;
  draft: string;
  onDraftChange: (text: string) => void;
}

/**
 * Production's `ChatHome`, kept in its composition — the banner behind a
 * centred headline, a 602px field — with two changes:
 *
 *  - One line under the headline says what the answers come from. The
 *    headline says "with AI"; it never says with what.
 *  - The suggestions stand under the field at rest (four, production shows
 *    three) instead of in a dropdown that exists only while the field has
 *    focus. An offer you have to click into the box to discover is not an
 *    offer on a page whose whole job is to be asked something. While you type
 *    they yield to questions matching your words (the ai-search rule).
 */
function NewChat({ scope, onRemoveScope, onAsk, draft, onDraftChange }: NewChatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [live, setLive] = useState(draft);
  const suggestions = useMemo(() => suggestQuestions(live, { pool: scope?.prompts }), [live, scope]);
  const prompts = scope?.prompts ?? SUGGESTED_PROMPTS;

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !el.value) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 1}px`;
  }, []);

  const submit = (text?: string) => {
    const value = (text ?? inputRef.current?.value ?? '').trim();
    if (value) onAsk(value);
  };

  return (
    <div className={s.home}>
      <div className={s.homeColumn}>
        <div className={s.hero}>
          <h1 className={s.heroTitle}>Explore Protocol Labs with AI Search</h1>
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
          <Composer
            ref={inputRef}
            id={COMPOSER_ID}
            size="home"
            placeholder={scope ? `Ask about ${scope.name}` : 'Ask anything about the network'}
            rows={1}
            autoFocus
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

        <div className={clsx(tt.root, s.prompts)}>
          {suggestions.length > 0 ? (
            <>
              <div className={tt.label}>Suggestions</div>
              <QuerySuggestions
                suggestions={suggestions}
                query={live}
                onPick={submit}
                variant="prompts"
                idPrefix="ai-search-page-suggestion"
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
