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
 *    ChatInput, InfoBox,                     components/core/husky) — analytics hooks inside
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';

import { PrototypeNavBar, SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import type { FoundItem } from '@/services/search/types';

import { SearchPopover, SEARCH_PLACEHOLDER } from './SearchPopover';
import { AiSearchView, type AiSearchRequest } from './AiSearchView';
import { buildCorpusScope } from './corpusScope';
import type { AiSearchScope } from './scope';
import { AiSearchViewerContext, type AiSearchViewer } from './viewer';
import { AnswerStatusVariantContext, type AnswerStatusVariant } from './AnswerStatus';
import { LoaderSpecimens } from './LoaderSpecimens';
import { FOUNDER_STATE_QUESTIONS, INVESTORS_QUESTION } from './mocks';
import demo from '../team-profile/TeamProfile.module.scss';
import { useAskIntro } from '../warm-intros-founders/useAskIntro';
import s from './AiSearchPrototype.module.scss';

interface FounderState {
  key: string;
  label: string;
  question: string;
  seat: AiSearchViewer;
}

/** What a founder can meet in an answer. "Member view" is the control: the person question, asked by someone who isn't one. */
const FOUNDER_STATES: FounderState[] = [
  { key: 'list', label: 'Investor list', question: FOUNDER_STATE_QUESTIONS.list, seat: 'founder' },
  { key: 'person', label: 'A person', question: FOUNDER_STATE_QUESTIONS.person, seat: 'founder' },
  { key: 'fund', label: 'A fund', question: FOUNDER_STATE_QUESTIONS.fund, seat: 'founder' },
  { key: 'noPath', label: 'No warm path', question: FOUNDER_STATE_QUESTIONS.noPath, seat: 'founder' },
  { key: 'member', label: 'Member view', question: FOUNDER_STATE_QUESTIONS.person, seat: 'member' },
];

/**
 * Search in two sizes — one field, two surfaces.
 *
 * The page is only a host: the proposal is the pair. The header field is the
 * field: it widens in the bar and you type there, with the **keyword popover**
 * (a lookup, sized as one) hanging under it as results only — a field that
 * opens a second field is the thing production shrank its own to a glyph to
 * avoid. The popover's AI row grows into the
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
  /** Demo seat. A founder's investor answers carry "Ask for intro"; a member's don't. */
  const [viewer, setViewer] = useState<AiSearchViewer>('founder');
  const [loader, setLoader] = useState<AnswerStatusVariant>('text');

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

  /* Closing the popover keeps what was typed. Leaving a search — by ✕, Esc or
     a click outside — is not a decision to throw the words away, and retyping
     a name you already typed is the one thing a reopened field can spare you
     (Raycast, Spotlight and the browser's own bar all restore the last term).
     Emptying it stays a press: the field's own Clear. */
  const closeSearch = useCallback(() => setSearchOpen(false), []);

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

  /* A "Founder states" tab: set the seat the state belongs to, then ask its
     question. Both land in one render, so the thread is built for that seat. */
  const [founderState, setFounderState] = useState<string | null>(null);
  const openState = useCallback((state: FounderState) => {
    setFounderState(state.key);
    setViewer(state.seat);
    setSearchOpen(false);
    setScope(null);
    setRequest({ question: state.question, origin: null, nonce: Date.now() });
    setAiOpen(true);
  }, []);

  const backToResults = useCallback(() => {
    setAiOpen(false);
    setScope(null);
    setSearchOpen(true);
  }, []);

  /* The header's search control, which the popover hangs under: the field you
     type in from tablet-landscape up, the glyph below that. */
  const anchor = useCallback(() => document.querySelector<HTMLElement>(SEARCH_ANCHOR_SELECTOR), []);

  const searchField = useMemo(() => ({ value: term, onChange: setTerm, placeholder: SEARCH_PLACEHOLDER }), [term]);

  /* The popover's investor rows ask through the page's own form: the popover
     can unmount (Esc, a close) while the form is still being filled in. */
  const { askFor, ask: askIntro, asking, modal: askModal } = useAskIntro();
  const intro = useMemo(
    () => (viewer === 'founder' ? { askFor, onAsk: askIntro } : undefined),
    [viewer, askFor, askIntro],
  );

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={close}
        term={term}
        onTermChange={setTerm}
        onAskAi={askAi}
        onAskAbout={askAbout}
        intro={intro}
        holdOpen={asking}
        anchor={anchor}
        fieldInHeader
      />
    ),
    [term, askAi, askAbout, anchor, intro, asking],
  );

  if (!mounted) return <div />;

  return (
    <AiSearchViewerContext.Provider value={viewer}>
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

      <AnswerStatusVariantContext.Provider value={loader}>
        <AiSearchView
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          request={request}
          onBackToResults={backToResults}
          scope={scope}
        />
      </AnswerStatusVariantContext.Provider>

      {/* Demo scaffolding, in the prototypes' own demo-bar chrome. The seat is a
          switch; the states are presses — each opens the AI view on the question
          that produces that state, in the seat it belongs to. */}
      <div className={demo.demoBar}>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Signed in as</span>
          <div className={demo.demoSwitch}>
            {(['founder', 'member'] as const).map((seat) => (
              <button
                key={seat}
                type="button"
                className={`${demo.demoBtn} ${viewer === seat ? demo.demoBtnActive : ''}`}
                onClick={() => setViewer(seat)}
              >
                {seat === 'founder' ? 'Founder' : 'Member'}
              </button>
            ))}
          </div>
        </div>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Loader</span>
          <div className={demo.demoSwitch}>
            {(
              [
                ['text', 'With text'],
                ['build', 'No text'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${demo.demoBtn} ${loader === key ? demo.demoBtnActive : ''}`}
                onClick={() => setLoader(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Founder states</span>
          <div className={demo.demoSwitch}>
            {FOUNDER_STATES.map((state) => (
              <button
                key={state.key}
                type="button"
                className={`${demo.demoBtn} ${founderState === state.key ? demo.demoBtnActive : ''}`}
                onClick={() => openState(state)}
              >
                {state.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className={s.page}>
        <h1 className={s.title}>Search in two sizes</h1>
        <p className={s.lede}>
          General search typed straight into the header field, with the results in a popover under it, and AI Search
          as a full-screen view. One field, one AI door; the popover&apos;s row grows into the view with your term carried over, and Back brings the popover
          back with the term still in it. Everything is mocked; the corpus is a dozen invented members, teams, projects
          and events.
        </p>
        <LoaderSpecimens />
        <ol className={s.steps}>
          <li>
            <strong>Click the header field</strong> or press ⌘K. The field widens in the bar with the caret in it, and
            a card hangs under it: an <em>Ask AI Search a question</em> row, then your recent searches.
          </li>
          <li>
            <strong>Type</strong> a name — <em>filecoin</em>, <em>zk berlin</em>, <em>lisbon</em> — and the results
            list in the card, with <em>Chat with AI Search about “…”</em> pinned above them, also when nothing matches.
            Under that row, up to two whole questions that start where your typing did (<em>fil ber</em> offers{' '}
            <em>Find teams building on Filecoin in Berlin</em>); the AI view&apos;s own field offers the full list as you
            type, walkable with ↓ ↑ and Enter.
            Use the <em>Ask AI</em> action on a team or member row: it opens the AI view about that team or person, not
            about the words.
          </li>
          <li>
            <strong>Press that row</strong> and the AI view takes the screen: a streamed answer with sources, directory
            results and follow-ups. Ask <em>Compare Lumen Storage and Saturn Grid</em> (a prompt, and a follow-up of the
            Filecoin answer) for an answer that is a table. Rate it with the thumbs; a thumbs-down asks why, inline. <em>Back to results</em>{' '}
            returns to the popover; <em>New question</em> returns to the view&apos;s prompts and history. Close and
            reopen: the chat is kept under history, and anything typed but not sent — the search term, a half-written
            follow-up — is still in its field.
          </li>
          <li>
            <strong>Scoped to a team:</strong> on the{' '}
            <a href="/prototypes/team-profile">team profile</a>, <em>Ask AI</em> in the header&apos;s actions opens the
            AI view with the team as a chip in the field. The prompts come from the profile&apos;s own sections,
            and each answer shows what it read, the people it found, and a button to the section they belong to.
            Remove the chip to ask the whole network.
          </li>
          <li>
            <strong>Founders — ask for an intro:</strong> the <em>Founder states</em> tabs above the page open each
            case: a list of investors, an answer about one person or one fund (the intro is offered unasked, as a line
            under the answer), an investor nobody in the network knows, and the same question as a member. Or, signed in
            as a founder, ask{' '}
            <em>{INVESTORS_QUESTION}</em> — it is the first prompt. The answer lists the investors as your Fundraising
            rows: who can introduce you, and <em>Ask for intro</em>. The request goes to that person, never to the
            investor, and shows up on your{' '}
            <a href="/prototypes/warm-intros-founders">team page&apos;s Fundraising section</a> and on the investor&apos;s
            profile. As a member the same question returns the investors only.
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
      {askModal}
    </AiSearchViewerContext.Provider>
  );
}
