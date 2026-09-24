'use client';

/**
 * Search in two sizes, with an intro on every member.
 *
 * A copy of `ai-search`'s host page with the founder-only warm-intro apparatus
 * taken out — no seat switch, no founder states, no investor rows — and one
 * thing put in: every member found, in the popover's rows or in an answer's
 * "Results from the directory" cards, carries the envelope. Pressing it opens
 * the Demo Day "Make an intro" form pointed at the PL team, who makes the
 * intro. The request is the same record the member and team profiles write
 * (`intro-shared/`), so a member asked for here reads "Intro requested" on
 * their page.
 *
 * The search pieces are imported from `ai-search`; they take the intro as an
 * optional prop and are unchanged for the original entry.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';

import { PrototypeNavBar, SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import type { FoundItem } from '@/services/search/types';

import { SearchPopover, SEARCH_PLACEHOLDER } from '../ai-search/SearchPopover';
import { AiSearchView, type AiSearchRequest } from '../ai-search/AiSearchView';
import { buildCorpusScope } from '../ai-search/corpusScope';
import type { AiSearchScope } from '../ai-search/scope';
import { AiSearchViewerContext } from '../ai-search/viewer';
import { useRequestIntro } from '../intro-shared/useRequestIntro';
import type { RequestIntroApi } from '../intro-shared/introRequests';
import s from '../ai-search/AiSearchPrototype.module.scss';

export default function AiSearchIntrosPrototype() {
  // The dialogs use framer-motion + a portal; gate so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [request, setRequest] = useState<AiSearchRequest | null>(null);
  /** Set by a result row's "Ask AI": the view opens with that team or person as its chip. */
  const [scope, setScope] = useState<AiSearchScope | null>(null);

  /* ⌘K everywhere on the page. */
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

  /* Closing the popover keeps what was typed (see `ai-search`). */
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  /* The popover's AI row: the term becomes the first question. */
  const askAi = useCallback((q: string) => {
    setSearchOpen(false);
    setScope(null);
    setRequest({ question: q, origin: q ? 'results' : null, nonce: Date.now() });
    setAiOpen(true);
  }, []);

  /* A row's "Ask AI": the view opens idle, chip in place. */
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

  const anchor = useCallback(() => document.querySelector<HTMLElement>(SEARCH_ANCHOR_SELECTOR), []);
  const searchField = useMemo(() => ({ value: term, onChange: setTerm, placeholder: SEARCH_PLACEHOLDER }), [term]);

  /* The rows and cards ask through the page's own form: the popover can
     unmount (Esc, a close) while the form is still being filled in. */
  const { requested, request: requestIntro, asking, layer: introLayer } = useRequestIntro();
  const intro = useMemo<RequestIntroApi>(() => ({ requested, onRequest: requestIntro }), [requested, requestIntro]);

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={close}
        term={term}
        onTermChange={setTerm}
        onAskAi={askAi}
        onAskAbout={askAbout}
        requestIntro={intro}
        holdOpen={asking}
        anchor={anchor}
        fieldInHeader
      />
    ),
    [term, askAi, askAbout, anchor, intro, asking],
  );

  if (!mounted) return <div />;

  return (
    <AiSearchViewerContext.Provider value="member">
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        searchable
        searchOpen={searchOpen}
        onSearchOpenChange={(open) => (open ? setSearchOpen(true) : closeSearch())}
        renderSearchModal={renderSearchModal}
        searchField={searchField}
        onAiSearchClick={() => askAi('')}
      />

      <AiSearchView
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        request={request}
        onBackToResults={backToResults}
        scope={scope}
        requestIntro={intro}
      />

      <main className={s.page}>
        <h1 className={s.title}>Search — request an intro</h1>
        <p className={s.lede}>
          The search in two sizes, with the envelope on every member: in the popover&apos;s rows beside Ask AI, and on
          the member cards under an AI answer. It opens the Demo Day &ldquo;Make an intro&rdquo; form, pointed at the PL
          team. Everything is mocked; requests are kept for the tab and shared with the{' '}
          <a href="/prototypes/member-profile">member profile</a> and the{' '}
          <a href="/prototypes/team-profile">team profile</a>.
        </p>
        <ol className={s.steps}>
          <li>
            <strong>Click the header field</strong> or press ⌘K, and type a name — <em>amara</em>, <em>lisbon</em>,{' '}
            <em>office hours</em>. Member rows end in <em>Ask AI</em> and the envelope.
          </li>
          <li>
            <strong>Press the envelope.</strong> The form names the person, says the request goes to the PL team, and
            asks why. Send it: the row shows a check, and the same person on their profile reads{' '}
            <em>Intro requested</em>.
          </li>
          <li>
            <strong>Ask AI Search</strong> — <em>Who at Lumen Storage offers office hours?</em> — and the member cards
            under the answer carry the envelope too.
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
      {introLayer}
    </AiSearchViewerContext.Provider>
  );
}
