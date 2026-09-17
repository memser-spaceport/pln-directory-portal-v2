'use client';

/**
 * REUSE MAP — what this entry imports vs. transcribes
 *
 * IMPORTED (read-only, import-safe):
 *  - PrototypeNavBar / PrototypeMobileNav   nav-shared header + bottom bar (search control is the trigger)
 *  - Modal, Button, Tag                     @/components/common, @/components/ui
 *  - DebouncedInput, SearchCategories,      production search overlay pieces — the field, the
 *    CollapsibleSection, SearchResultsSection  category chips and the result rows, fed mocked
 *                                            `SearchResult` data (services/search/types shape)
 *  - getGroupTitleByGroupName                production's Title Case helper for section titles
 *  - FollowupQuestions, HuskySourceCard,     Husky answer anatomy (components/page/husky,
 *    HuskyAnswerLoader, ChatInput, InfoBox,  components/core/husky) — analytics hooks inside
 *    PopoverDp, Markdown                     them no-op without a PostHog client
 *  - ChatSubheader                           production's history subheader (import-safe)
 *  - Stylesheets: PrototypeSearchModal (the AI view's sheet), FullSearchResults, RecentSearch,
 *    TryToSearch, ResultsList, ChatHistory, ChatSubheader — so the new rows use production's classes
 *
 * TRANSCRIBED (copy-simplify, styled-jsx sources can't be imported):
 *  - PreviewMessage card + ChatMessageActions row → AnswerPanel.tsx / .module.scss
 *    (values copied verbatim; the feedback control is the deliberate change)
 *  - DirectoryResults → DirectoryResultsCards.tsx (redrawn on purpose; see that file)
 *  - RecentSearch markup (react-query bound) → inline in SearchPopover, local state
 *
 * NOT REUSED, on purpose:
 *  - AiChatPanel / chat.tsx                 both need auth + the streaming endpoint; replaced by a
 *                                            mocked stream in AnswerPanel
 *  - ChatFeedback (1–5 dialog)              replaced by inline thumbs + reasons — see AnswerPanel
 *  - NothingFound, TryAiSearch              both AI doors folded into one row in the popover
 */

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import type { FoundItem } from '@/services/search/types';

import { SearchPopover } from './SearchPopover';
import { AiSearchView, type AiSearchRequest } from './AiSearchView';
import { buildCorpusScope } from './corpusScope';
import type { AiSearchScope } from './scope';
import s from './AiSearchPrototype.module.scss';

/**
 * Search in two sizes — one field, two surfaces.
 *
 * The page is only a host: the proposal is the pair. The header control opens
 * the **keyword popover** (a lookup, sized as one); its AI row grows into the
 * **AI Search view** (a takeover, sized for reading an answer). The seam is the
 * handoff: the term travels forward as the first question, and Back reopens
 * the popover with the term still in it. This page owns the term and the two
 * open flags so that trip is one state change in each direction.
 */
export default function AiSearchPrototype() {
  // The dialogs use framer-motion + a portal; gate so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [request, setRequest] = useState<AiSearchRequest | null>(null);
  /** Set by a result row's "Ask AI": the view opens with that team or person as its chip. */
  const [scope, setScope] = useState<AiSearchScope | null>(null);

  /* ⌘K everywhere on the page. Production has no keyboard route into search;
     every palette in the reference set (Bonsai, Apollo, Databricks) has this. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Closing the popover by ✕, Esc or a click outside starts the next visit
     clean. The AI handoff below closes it *without* clearing the term. */
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setTerm('');
  }, []);

  /* The popover's AI row: the term becomes the first question, and the
     popover remembers it for Back. An empty term opens the view idle. */
  const askAi = useCallback((q: string) => {
    setSearchOpen(false);
    setScope(null);
    setRequest({ question: q, origin: q ? 'results' : null, nonce: Date.now() });
    setAiOpen(true);
  }, []);

  /* A row's "Ask AI": the view opens idle, chip in place, on that record's
     own prompts — we know which team or person, not yet which question. */
  const askAbout = useCallback((item: FoundItem) => {
    setSearchOpen(false);
    setScope(buildCorpusScope(item));
    setRequest({ question: '', origin: 'results', nonce: Date.now() });
    setAiOpen(true);
  }, []);

  const backToResults = useCallback(() => {
    setAiOpen(false);
    setScope(null);
    setSearchOpen(true);
  }, []);

  /* The header's search control, which the popover hangs under. */
  const anchor = useCallback(() => document.querySelector<HTMLElement>('header button[aria-label="Search"]'), []);

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={() => {
          close();
          setTerm('');
        }}
        term={term}
        onTermChange={setTerm}
        onAskAi={askAi}
        onAskAbout={askAbout}
        anchor={anchor}
      />
    ),
    [term, askAi, askAbout, anchor],
  );

  if (!mounted) return <div />;

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        searchable
        searchOpen={searchOpen}
        onSearchOpenChange={(open) => (open ? setSearchOpen(true) : closeSearch())}
        renderSearchModal={renderSearchModal}
        onAiSearchClick={() => askAi('')}
      />

      <AiSearchView
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        request={request}
        onBackToResults={backToResults}
        scope={scope}
      />

      <main className={s.page}>
        <h1 className={s.title}>Search in two sizes</h1>
        <p className={s.lede}>
          General search as a popover under the header field, and AI Search as a full-screen view. One field, one AI
          door; the popover&apos;s row grows into the view with your term carried over, and Back brings the popover
          back with the term still in it. Everything is mocked; the corpus is a dozen invented members, teams, projects
          and events.
        </p>
        <ol className={s.steps}>
          <li>
            <strong>Open search</strong> from the header control or ⌘K. A card hangs under it: an <em>Ask AI Search a
            question</em> row, then your recent searches.
          </li>
          <li>
            <strong>Type</strong> a name — <em>filecoin</em>, <em>zk berlin</em>, <em>lisbon</em> — and the results
            list in the card, with <em>Chat with AI Search about “…”</em> pinned above them, also when nothing matches.
            Use the <em>Ask AI</em> action on a team or member row: it opens the AI view about that team or person, not
            about the words.
          </li>
          <li>
            <strong>Press that row</strong> and the AI view takes the screen: a streamed answer with sources, directory
            results and follow-ups. Rate it with the thumbs; a thumbs-down asks why, inline. <em>Back to results</em>{' '}
            returns to the popover; <em>New question</em> returns to the view&apos;s prompts and history. Close and
            reopen: the chat is kept under history.
          </li>
          <li>
            <strong>Scoped to a team:</strong> on the{' '}
            <a href="/prototypes/team-profile">team profile</a> in team view, <em>Ask AI about Protocol Labs</em> opens
            the AI view with the team as a chip in the field. The prompts come from the profile&apos;s own sections,
            and each answer shows what it read, the people it found, and a button to the section they belong to.
            Remove the chip to ask the whole network.
          </li>
        </ol>
        <div className={s.cta}>
          <Button size="s" onClick={() => setSearchOpen(true)}>
            Open search
          </Button>
          <kbd className={s.kbd}>⌘K</kbd>
          <Button size="s" style="border" variant="neutral" onClick={() => askAi('')}>
            Open AI Search
          </Button>
        </div>
      </main>

      <PrototypeMobileNav hasUnreadNews={false} newsHref="/prototypes/newsfeed" active={false} />
    </>
  );
}
