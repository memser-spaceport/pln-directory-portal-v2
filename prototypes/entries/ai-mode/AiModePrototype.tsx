'use client';

/**
 * REUSE MAP — ai-mode (LAB-2702, "Design AI mode page and chat history")
 *
 * IMPORTED from the ai-search entry (unchanged behaviour for its other hosts):
 *  - SearchPopover       the general search under the header field. New
 *                        optional `aiHistory` prop: the latest chats at rest
 *                        with an "All chats" door to this page.
 *  - AnswerPanel         the thread (answer, directory cards, sources,
 *                        follow-ups, thumbs, input). New optional props:
 *                        `hideBar` (this page owns Back / New chat) and
 *                        `layout="page"` (centred reading column).
 *  - QuerySuggestions, suggestQuestions, prompts, corpus scope, SearchField
 *    and AiSearchView stylesheets (scope chip, prompt rows)
 *  - nav-shared          PrototypeNavBar (header field + AI badge),
 *                        PrototypeMobileNav, the takeover shell stylesheet
 *
 * IMPORTED from production (read-only):
 *  - ChatInput (components/page/husky/chat-input) — the composer, both on the
 *    new-chat page and under a thread
 *  - ConfirmDialog — delete a chat, as production's Husky sidebar confirms
 *  - Modal, Button, ArrowBackIcon, CloseIcon
 *  - ChatHistory / ChatSubheader / TryToSearch stylesheets
 *
 * TRANSCRIBED (service-bound in production):
 *  - app-sidebar.tsx (the /husky rail: New Conversation, Threads grouped by
 *    date, delete with confirm, ⌘B) → HistoryList + the rail in AiModeSurface.
 *    History is mocked from the ai-search seed plus three more.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import type { FoundItem } from '@/services/search/types';

import { PrototypeNavBar, SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { SearchPopover, SEARCH_PLACEHOLDER } from '../ai-search/SearchPopover';
import { buildCorpusScope } from '../ai-search/corpusScope';
import hs from '../ai-search/AiSearchPrototype.module.scss';
import demo from '../team-profile/TeamProfile.module.scss';

import { AiModeSurface, type AiModeFrame, type AiModeRequest } from './AiModeSurface';
import { seedThreads, threadTitle, whenLabel, type ChatThread } from './threads';

/** The popover lists this many chats at rest. */
const POPOVER_CHATS = 3;

/**
 * Two surfaces, one seam. General search is the popover under the header
 * field; AI Search is a mode you enter from it and leave back into it.
 *
 * This page hosts both and owns what crosses the seam: the term (kept both
 * ways — it becomes the first question going in, and it is back in the field
 * coming out), the threads (the popover lists the latest, the mode's rail
 * lists all of them), and which frame the mode wears — the page (proposed) or
 * the takeover with a collapsible rail (the alternative still on the table),
 * switchable in the review band so the two can be compared on the same data.
 */
export default function AiModePrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [frame, setFrame] = useState<AiModeFrame>('page');
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [request, setRequest] = useState<AiModeRequest | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>(seedThreads);
  const [activeId, setActiveId] = useState<number | null>(null);

  const enterAi = useCallback((req: Omit<AiModeRequest, 'nonce'>) => {
    setSearchOpen(false);
    setRequest({ ...req, nonce: Date.now() });
    setAiMode(true);
  }, []);

  /* Leaving the mode is going back to search, with the words you left with. */
  const backToSearch = useCallback(() => {
    setAiMode(false);
    setSearchOpen(true);
  }, []);

  /* ⌘K opens search from anywhere, the mode included. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* The page's tab title, renamed with the route: production's /husky layout
     says "AI Chat | Protocol Labs Directory". */
  const onAiPage = aiMode && frame === 'page';
  useEffect(() => {
    if (!onAiPage) return;
    const before = document.title;
    document.title = 'AI Search | Protocol Labs Directory';
    return () => {
      document.title = before;
    };
  }, [onAiPage]);

  const anchor = useCallback(() => document.querySelector<HTMLElement>(SEARCH_ANCHOR_SELECTOR), []);
  const searchField = useMemo(() => ({ value: term, onChange: setTerm, placeholder: SEARCH_PLACEHOLDER }), [term]);

  const aiHistory = useMemo(
    () => ({
      items: threads
        .slice(0, POPOVER_CHATS)
        .map((t) => ({ id: t.id, title: threadTitle(t), when: whenLabel(t.createdAt) })),
      total: threads.length,
      onOpen: (id: number) => enterAi({ threadId: id }),
      onShowAll: () => enterAi({ showHistory: true }),
    }),
    [threads, enterAi],
  );

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={close}
        term={term}
        onTermChange={setTerm}
        onAskAi={(q) => enterAi(q ? { question: q } : {})}
        onAskAbout={(item: FoundItem) => enterAi({ scope: buildCorpusScope(item) })}
        anchor={anchor}
        fieldInHeader
        aiHistory={aiHistory}
      />
    ),
    [term, enterAi, anchor, aiHistory],
  );

  if (!mounted) return <div />;

  const urlReadout = onAiPage ? (activeId != null ? `/ai-search/${activeId}` : '/ai-search') : null;

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        searchable
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        renderSearchModal={renderSearchModal}
        searchField={searchField}
        onAiSearchClick={() => enterAi({})}
      />

      {/* Review band: which frame the mode wears. Not part of the proposal. */}
      <div className={demo.demoBar}>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>AI Search opens as</span>
          <div className={demo.demoSwitch}>
            {(
              [
                ['page', 'Page (proposed)'],
                ['modal', 'Modal + history'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${demo.demoBtn} ${frame === key ? demo.demoBtnActive : ''}`}
                onClick={() => setFrame(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {urlReadout && (
          <div className={demo.demoGroup}>
            <span className={demo.demoLabel}>URL</span>
            <code className={demo.demoLabel}>{urlReadout}</code>
          </div>
        )}
      </div>

      <AiModeSurface
        frame={frame}
        open={aiMode}
        onClose={() => setAiMode(false)}
        threads={threads}
        onThreadsChange={setThreads}
        activeId={activeId}
        onActiveIdChange={setActiveId}
        request={request}
        term={term}
        onBackToSearch={backToSearch}
      />

      {!onAiPage && (
        <main className={hs.page}>
          <h1 className={hs.title}>AI Search as a mode</h1>
          <p className={hs.lede}>
            Two surfaces instead of three. General search stays a popover under the header field; AI Search is one mode
            with a page of its own at <code>/ai-search</code> (was <code>/husky</code>), where the conversation and
            every past conversation live. Everything is mocked.
          </p>
          <ol className={hs.steps}>
            <li>
              <strong>Click the header field.</strong> At rest the popover offers <em>Ask AI Search a question</em>,
              your recent searches and, under them, <em>Recent AI Search chats</em> with <em>All chats</em> — the
              signpost to where chats live.
            </li>
            <li>
              <strong>Type</strong> <em>filecoin</em> and press <em>Chat with AI Search about “filecoin”</em>. AI Search
              opens as a page: the answer in the middle, <em>History</em> on the left grouped by date, the new chat at
              the top of Today.
            </li>
            <li>
              <strong>Back to search</strong> (top left of the page) leaves the mode and reopens the popover with
              “filecoin” still in the field. Your chat is the first row of Recent AI Search chats.
            </li>
            <li>
              <strong>In the page:</strong> New chat, open any past chat, delete one (hover a row), collapse the rail
              with its panel icon or ⌘B. A team or member row&apos;s <em>Ask AI</em> opens a new chat about them.
            </li>
            <li>
              <strong>On a phone</strong> the rail is a drawer behind <em>History</em> in the page bar; New chat sits
              beside it while a chat is open.
            </li>
            <li>
              <strong>Compare:</strong> switch <em>AI Search opens as</em> to <em>Modal + history</em> — the same
              surface in the takeover dialog, its rail collapsed to three glyphs, five recent chats and{' '}
              <em>Show all history</em> once expanded.
            </li>
          </ol>
          <div className={hs.cta}>
            <Button size="s" onClick={() => setSearchOpen(true)}>
              Open search
            </Button>
            <kbd className={hs.kbd}>⌘K</kbd>
            <Button size="s" style="border" variant="neutral" onClick={() => enterAi({})}>
              Open AI Search
            </Button>
          </div>
        </main>
      )}

      {/* The chat page has its input at the bottom edge; the tab bar under it
          would stack two bars where the thumb is. The page bar's Back to
          search is the way out on phones. */}
      {!onAiPage && <PrototypeMobileNav hasUnreadNews={false} newsHref="/prototypes/newsfeed" active={false} />}
    </>
  );
}
