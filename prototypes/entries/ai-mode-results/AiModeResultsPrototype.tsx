'use client';

/**
 * REUSE MAP — ai-mode-results (a visual pass on AI mode's answer components)
 *
 * From the 2026-10-05 design review: the AI mode page's flow is fine, but the
 * components inside an answer look dated. This entry is a copy of
 * ai-search-page (the AI mode page) with ONE change of substance: the thread
 * can be drawn by the current answer components (ai-search/AnswerPanel, which
 * ai-search-page and ai-mode both use) or by the proposed ones in ./proposed.
 * The review band's Answers switch flips them on the same conversation.
 * The flow, the page chrome, the turns and the mocked answers are identical.
 *
 * IMPORTED from production (read-only): ChatInput (via Composer), Button,
 *   ConfirmDialog, toast, icons (incl. ThumbsDownIcon), OhBadge, TagsList,
 *   markdown-to-jsx (the library production's Markdown wraps)
 * IMPORTED from sibling entries: ai-search (makeTurn, mocks, IntroPathsRows,
 *   the current AnswerPanel), ai-mode (threads, HistoryList), nav-shared.
 * NEW in ./proposed: see PROPOSAL.md for each component, before → after.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { newThreadId, seedThreads, type ChatThread } from '../ai-mode/threads';
import { makeTurn } from '../ai-search/AnswerPanel';
import demo from '../team-profile/TeamProfile.module.scss';

import { AiSearchPage } from './AiSearchPage';
import { ANSWER_CHANGES, sharedChat, titleFor, withTitle, type SharedChat } from './mocks';
import s from './AiModeResultsPrototype.module.scss';

type Viewer = 'in' | 'out';
type Start = 'new' | 'chat' | 'shared';

type Answers = 'current' | 'proposed';

export default function AiModeResultsPrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [viewer, setViewer] = useState<Viewer>('in');
  /* Opens on a chat: the answer components are what is under review, so the
     resting frame is an answered thread, not the new-chat page. */
  const [start, setStart] = useState<Start>('chat');
  const [answers, setAnswers] = useState<Answers>('proposed');
  const [showChanges, setShowChanges] = useState(false);

  /* Signed in: the saved history. Signed out: this visit only, starting empty. */
  const [saved, setSaved] = useState<ChatThread[]>(() => seedThreads().map(withTitle));
  const [visit, setVisit] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(
    /* The two-turn Filecoin chat: lists, entity mentions, cards and follow-ups in one view. */
    () => (saved.find((x) => x.title === 'Filecoin teams in Berlin') ?? saved[0])?.id ?? null,
  );
  const [shared, setShared] = useState<SharedChat | null>(null);

  const signedIn = viewer === 'in';
  const threads = signedIn ? saved : visit;
  const setThreads = signedIn ? setSaved : setVisit;

  /* The review band's "Opens on" puts the page in a starting state. */
  const openOn = useCallback(
    (next: Start, list: ChatThread[]) => {
      setStart(next);
      setShared(next === 'shared' ? sharedChat() : null);
      setActiveId(next === 'chat' ? (list[0]?.id ?? null) : null);
    },
    [],
  );

  const switchViewer = (next: Viewer) => {
    setViewer(next);
    openOn(start === 'chat' && next === 'out' && visit.length === 0 ? 'new' : start, next === 'in' ? saved : visit);
  };

  /* Arriving with a question — the Home field (home-ai-ask) hands it over as
     `?q=`. `answered=1` means Home already answered it inline ("Continue in AI
     Search"), so the thread opens on that answer instead of asking again;
     `viewer=out` keeps a signed-out visitor signed out. */
  /* Once per load: React's dev double-run would otherwise file it twice. */
  const arrived = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q')?.trim();
    if (!q || arrived.current) return;
    arrived.current = true;
    const out = params.get('viewer') === 'out';
    const turn = makeTurn(q);
    const thread: ChatThread = {
      id: newThreadId(),
      createdAt: new Date(),
      scope: null,
      title: titleFor(q),
      turns: [params.get('answered') === '1' ? { ...turn, shown: turn.answer, status: 'done' } : turn],
    };
    if (out) {
      setViewer('out');
      setVisit((prev) => [thread, ...prev]);
    } else {
      setSaved((prev) => [thread, ...prev]);
    }
    setStart('chat');
    setActiveId(thread.id);
  }, []);

  /* Production's /husky layout titles the tab "AI Chat | Protocol Labs Directory". */
  useEffect(() => {
    const before = document.title;
    document.title = 'AI Search | Protocol Labs Directory';
    return () => {
      document.title = before;
    };
  }, []);

  if (!mounted) return <div />;

  const shownId = shared?.thread.id ?? activeId;

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        isLoggedIn={signedIn}
        onSignIn={() => switchViewer('in')}
        onSignUp={() => switchViewer('in')}
      />

      {/* Review band. Not part of the proposal. */}
      <div className={demo.demoBar}>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Answers</span>
          <div className={demo.demoSwitch}>
            {(
              [
                ['current', 'Current'],
                ['proposed', 'Proposed'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${demo.demoBtn} ${answers === key ? demo.demoBtnActive : ''}`}
                onClick={() => setAnswers(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Viewer</span>
          <div className={demo.demoSwitch}>
            {(
              [
                ['in', 'Signed in'],
                ['out', 'Signed out'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${demo.demoBtn} ${viewer === key ? demo.demoBtnActive : ''}`}
                onClick={() => switchViewer(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>Opens on</span>
          <div className={demo.demoSwitch}>
            {(
              [
                ['new', 'New chat'],
                ['chat', 'A chat'],
                ['shared', 'Shared link'],
              ] as const
            )
              .filter(([key]) => key !== 'chat' || threads.length > 0)
              .map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`${demo.demoBtn} ${start === key ? demo.demoBtnActive : ''}`}
                  onClick={() => openOn(key, threads)}
                >
                  {label}
                </button>
              ))}
          </div>
        </div>
        <div className={demo.demoGroup}>
          <span className={demo.demoLabel}>URL</span>
          <code className={demo.demoLabel}>{shownId != null ? `/ai-search/${shownId}` : '/ai-search'}</code>
        </div>
        <button
          type="button"
          className={s.changesToggle}
          onClick={() => setShowChanges((v) => !v)}
          aria-expanded={showChanges}
        >
          {showChanges ? 'Hide what changed' : 'What changed in answers'}
        </button>
      </div>

      {showChanges && (
        <div className={s.changes}>
          <table className={s.changesTable}>
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Current</th>
                <th scope="col">Proposed</th>
              </tr>
            </thead>
            <tbody>
              {ANSWER_CHANGES.map((c) => (
                <tr key={c.area}>
                  <th scope="row">{c.area}</th>
                  <td>{c.was}</td>
                  <td>{c.now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AiSearchPage
        signedIn={signedIn}
        threads={threads}
        onThreadsChange={setThreads}
        activeId={activeId}
        onActiveIdChange={setActiveId}
        shared={shared}
        onSharedChange={setShared}
        onSignIn={() => switchViewer('in')}
        onSignUp={() => switchViewer('in')}
        answers={answers}
      />
    </>
  );
}
