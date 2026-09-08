'use client';

/**
 * REUSE MAP — what this entry imports vs. transcribes
 *
 * IMPORTED (read-only, import-safe):
 *  - PrototypeNavBar / PrototypeMobileNav   nav-shared header + bottom bar (search icon is the trigger)
 *  - Modal, Button, Tag                     @/components/common, @/components/ui
 *  - DebouncedInput, SearchCategories,      production search overlay pieces — the field, the
 *    CollapsibleSection, SearchResultsSection  category chips and the result rows, fed mocked
 *                                            `SearchResult` data (services/search/types shape)
 *  - getGroupTitleByGroupName                production's Title Case helper for section titles
 *  - FollowupQuestions, DirectoryResults,    Husky answer anatomy (components/page/husky,
 *    HuskySourceCard, HuskyAnswerLoader,     components/core/husky) — analytics hooks inside
 *    ChatInput, InfoBox, PopoverDp, Markdown them no-op without a PostHog client
 *  - Stylesheets: PrototypeSearchModal (sibling chrome), FullSearchResults, RecentSearch,
 *    TryToSearch, ResultsList, AiChatPanel, Button — imported so the new rows use production's classes
 *
 * TRANSCRIBED (copy-simplify, styled-jsx sources can't be imported):
 *  - PreviewMessage card + ChatMessageActions row → AnswerPanel.tsx / .module.scss
 *    (values copied verbatim; the feedback control is the deliberate change)
 *  - RecentSearch markup (react-query bound) → inline in AiSearchModal, local state
 *
 * NOT REUSED, on purpose:
 *  - AiChatPanel / chat.tsx                 both need auth + the streaming endpoint; replaced by a
 *                                            mocked stream in AnswerPanel
 *  - ChatFeedback (1–5 dialog)              replaced by inline thumbs + reasons — see AnswerPanel
 *  - NothingFound, TryAiSearch              both AI doors folded into one "Ask Husky" row
 */

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/common/Button';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { AiSearchModal } from './AiSearchModal';
import s from './AiSearchPrototype.module.scss';

/**
 * AI search — one list, one door.
 *
 * The page is only a host: the proposal is the dialog. It renders the shared
 * prototype header with the search icon wired to `AiSearchModal`, adds the
 * ⌘K / Ctrl+K shortcut the product doesn't have, and says how to try it.
 */
export default function AiSearchPrototype() {
  // The dialog uses framer-motion + a portal; gate so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchOpen, setSearchOpen] = useState(false);

  /* ⌘K everywhere on the page. Production has no keyboard route into search;
     every palette in the reference set (Bonsai, Apollo, Databricks) has this. */
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

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => <AiSearchModal open={open} onClose={close} />,
    [],
  );

  if (!mounted) return <div />;

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        searchable
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        renderSearchModal={renderSearchModal}
      />

      <main className={s.page}>
        <h1 className={s.title}>AI search — one list, one door</h1>
        <p className={s.lede}>
          The header search with Husky as a row in the results and a state of the same dialog, instead of a second
          column with its own input. Everything is mocked; the corpus is a dozen invented members, teams, projects and
          events.
        </p>
        <ol className={s.steps}>
          <li>
            <strong>Open search</strong> from the header icon or ⌘K. The empty state offers recent searches and three
            prompts phrased as things to find.
          </li>
          <li>
            <strong>Type</strong> anything — <em>filecoin</em>, <em>zk berlin</em>, <em>lisbon</em>, or a question of
            your own. Keyword results appear as you type; a pinned <em>Ask Husky about “…”</em> row sits under them,
            also when nothing matches.
          </li>
          <li>
            <strong>Press it</strong> for a streamed answer with sources, directory results and follow-ups. Rate it with
            the thumbs; a thumbs-down asks why, inline. Back returns the list you came from.
          </li>
        </ol>
        <div className={s.cta}>
          <Button size="s" onClick={() => setSearchOpen(true)}>
            Open search
          </Button>
          <kbd className={s.kbd}>⌘K</kbd>
        </div>
      </main>

      <PrototypeMobileNav hasUnreadNews={false} newsHref="/prototypes/newsfeed" active={false} />
    </>
  );
}
