'use client';

/**
 * REUSE MAP — ai-search-page (production /husky, kept and refactored)
 *
 * The direction after the Sep 30 search question: AI Search stays a page of
 * its own (Google's AI Mode is a place, not an overlay) and the existing page
 * is refactored rather than rebuilt. Compare with production at
 * localhost:4200/husky/chat (signed in, for the sidebar).
 *
 * IMPORTED from production (read-only):
 *  - ChatInput (components/page/husky/chat-input), ConfirmDialog, Button,
 *    toast, CloseIcon, SearchIcon, the job board's ShareIcon
 *  - TryToSearch (prompt rows) and NewsShareMenu (⋯ menu) stylesheets
 *
 * IMPORTED from sibling entries:
 *  - ai-search: AnswerPanel (the answer, sources, directory cards, follow-ups,
 *    thumbs, input), QuerySuggestions, suggestions, prompts
 *  - ai-mode: HistoryList + threads (production's date buckets), rail/row/
 *    drawer classes, glyphs
 *  - nav-shared: PrototypeNavBar (signed in and out)
 *
 * TRANSCRIBED (service-bound in production): app-sidebar.tsx, chat-home.tsx,
 * chat-header.tsx, chat.tsx's layout — see AiSearchPage.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { newThreadId, seedThreads, type ChatThread } from '../ai-mode/threads';
import { makeTurn } from '../ai-search/AnswerPanel';
import type { AiSearchScope } from '../ai-search/scope';
import type { AiModeRequest } from '../ai-mode/AiModeSurface';
import { buildMemberAiScope } from '../member-profile/aiSearchScope';
import { MOCK_EXPERIENCE, MOCK_MEMBER } from '../member-profile/mocks';
import { teamScopeFromParams } from '../team-profile/aiSearchTab';
import demo from '../team-profile/TeamProfile.module.scss';

import { AiSearchPage } from './AiSearchPage';
import { CHANGES, sharedChat, titleFor, withTitle, type SharedChat } from './mocks';
import s from './AiSearchPagePrototype.module.scss';

type Viewer = 'in' | 'out';
type Start = 'new' | 'chat' | 'shared';

export default function AiSearchPagePrototype() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [viewer, setViewer] = useState<Viewer>('in');
  const [start, setStart] = useState<Start>('new');
  const [showChanges, setShowChanges] = useState(false);

  /* Signed in: the saved history. Signed out: this visit only, starting empty. */
  const [saved, setSaved] = useState<ChatThread[]>(() => seedThreads().map(withTitle));
  const [visit, setVisit] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
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

  /* A profile's Ask AI (member-ask-ai, team-profile) opens this page in a new
     tab with the person or team attached: the New chat's scope chip, or the
     scope of the thread a question chip starts. `about=team` also carries the
     seat the profile was viewed in (see team-profile/aiSearchTab). */
  const [request, setRequest] = useState<AiModeRequest | null>(null);

  /* Arriving with a question — the Home field (home-ai-ask) hands it over as
     `?q=`. `answered=1` means Home already answered it inline ("Continue in AI
     Search"), so the thread opens on that answer instead of asking again;
     `viewer=out` keeps a signed-out visitor signed out. `about=member` attaches
     Maya's profile as context (`oh=0`: the profile had no office hours). */
  /* Once per load: React's dev double-run would otherwise file it twice. */
  const arrived = useRef(false);
  useEffect(() => {
    if (arrived.current) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q')?.trim();
    const about = params.get('about');
    const scope =
      about === 'member'
        ? memberScope(params.get('oh') !== '0')
        : about === 'team'
          ? teamScopeFromParams(params)
          : null;
    if (!q) {
      if (scope) {
        arrived.current = true;
        setRequest({ nonce: Date.now(), scope });
      }
      return;
    }
    arrived.current = true;
    const out = params.get('viewer') === 'out';
    const turn = makeTurn(q, scope);
    const thread: ChatThread = {
      id: newThreadId(),
      createdAt: new Date(),
      scope,
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
          {showChanges ? 'Hide what changed' : 'What changed from /husky'}
        </button>
      </div>

      {showChanges && (
        <div className={s.changes}>
          <table className={s.changesTable}>
            <thead>
              <tr>
                <th scope="col">Area</th>
                <th scope="col">Production /husky</th>
                <th scope="col">This refactor</th>
              </tr>
            </thead>
            <tbody>
              {CHANGES.map((c) => (
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
        request={request}
      />
    </>
  );
}

/**
 * Maya's profile as an AI Search scope, from the same fixtures her profile
 * draws. An answer's door goes back to the card it came from on her profile.
 */
function memberScope(hasOfficeHours: boolean): AiSearchScope {
  return buildMemberAiScope({
    member: { ...MOCK_MEMBER, officeHours: hasOfficeHours ? MOCK_MEMBER.officeHours : null },
    experience: MOCK_EXPERIENCE,
    onOpen: (target) => window.open(`/prototypes/member-ask-ai#member-${target}`, '_blank'),
  });
}
