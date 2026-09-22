'use client';

/**
 * REUSE MAP
 *
 * IMPORTED (prototype folders, nothing redrawn):
 *  - NewsfeedPrototype            the homepage itself, through its optional host props
 *  - TeamProfilePrototype         the lead's team page, whole; it already opens the candidates page
 *  - PrototypeNavBar              the header over the team page, so the bell is one bell across both
 *  - useAiSearchHost              ai-search's popover + AI view, wired into that page's header
 *  - InvestorPathRow / RoleCandidates / TeamCandidatesPage   carry the `data-tour` anchors
 *  - GuidedTour                   tour-shared — the standard object this entry demonstrates
 *  - newsfeed-v0 switch chrome    the review band's own switch classes
 *  - Button                       @/components/common/Button
 *
 * NEW: only the steps below. The tour's rules live in GuidedTour.tsx.
 */

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { useIsMobile } from '@/hooks/useIsMobile';

import NewsfeedPrototype from '../newsfeed/NewsfeedPrototype';
import TeamProfilePrototype from '../team-profile/TeamProfilePrototype';
import { useAiSearchHost } from '../ai-search/useAiSearchHost';
import { AiSearchViewerContext, type AiSearchViewer } from '../ai-search/viewer';
import { INVESTORS_QUESTION } from '../ai-search/mocks';
import { BELL_ANCHOR_SELECTOR, PrototypeNavBar, SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { GuidedTour, type TourStep } from '../tour-shared/GuidedTour';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import s from './GuidedTourPrototype.module.scss';

type TourId = 'warm-intros' | 'candidates';

const TOURS: { id: TourId; label: string; feature: string }[] = [
  { id: 'candidates', label: 'Candidates', feature: 'Hiring' },
  { id: 'warm-intros', label: 'Warm intros', feature: 'AI Search' },
];

const COUNT_LINE = '[data-tour="candidates-count"]';

/**
 * Guided tours, met on Home.
 *
 * **Warm intros for founders in AI Search** (first use). The feature lives two
 * screens away from where a session starts — inside an AI Search answer — so a
 * callout on the header field could name it but not show it. The tour starts on
 * the field, asks the investor question for the founder ("Show me"), waits for
 * the answer to land, and ends on the press that matters.
 *
 * **Candidates on the team page.** Same shape, and the trigger is an event, not
 * a release: a lead's first arrival after someone applied to one of their
 * roles. A lead with no candidates has no count line, so they have no tour
 * (rule 4: the target has to exist). It starts on the bell — the homepage holds
 * nothing about candidates, and the bell is where "something happened to you"
 * already lives and the way back on every later visit — walks to the count
 * line under the role, and ends on the candidates page's pane bar. The job
 * board's second door gets no tour: `NewCandidatesBanner` announces it there.
 *
 * **One arrival, one tour.** Founders and leads are mostly the same people, so
 * both tours can be owed at once. The picker in the review band stands in for
 * the queue: the event-triggered one (candidates waiting) goes first, the
 * release one waits for the next arrival.
 *
 * Only for the people each feature is for: flip the seat in the review band —
 * a member has no intro rows and no count line, so no tour either way.
 */
export default function GuidedTourPrototype() {
  const [tour, setTour] = useState<TourId>('candidates');
  const [seat, setSeat] = useState<AiSearchViewer>('founder');
  const [signedIn, setSignedIn] = useState(true);
  // PROTOTYPE: open on every load; production shows it once per member.
  const [tourOpen, setTourOpen] = useState(true);
  /* Where the candidates tour has walked to. The team page is mounted in the
     homepage's place rather than linked: a route change would drop the tour. */
  const [place, setPlace] = useState<'home' | 'team'>('home');
  /* Remounts the tour, so Replay and the picker always start at step 1. */
  const [run, setRun] = useState(0);

  const isMobile = useIsMobile();
  const host = useAiSearchHost(seat);
  const { askAi, closeAi } = host;

  const eligible = signedIn && seat === 'founder';

  const steps = useMemo<TourStep[]>(
    () =>
      tour === 'warm-intros'
        ? [
            {
              target: SEARCH_ANCHOR_SELECTOR,
              title: 'Find investors who’d take an intro',
              body: 'Ask AI Search about investors. As a founder, your answers now name the person in the network who can introduce you.',
              nextLabel: 'Show me',
              onNext: () => askAi(INVESTORS_QUESTION),
              radius: 8,
            },
            {
              target: '[data-tour="intro-row"][data-tour-open]',
              title: 'Who can introduce you',
              body: 'Each investor comes with the one person in the network best placed to make the intro.',
              radius: 8,
            },
            {
              target: '[data-tour="ask-intro"][data-tour-open]',
              title: 'Ask for the intro',
              body: 'Your request goes to that person, never to the investor. Follow your asks in the Fundraising section of your team page.',
              radius: 10,
            },
          ]
        : [
            {
              target: BELL_ANCHOR_SELECTOR,
              title: 'People applied to your roles',
              body: 'Applications to Protocol Labs roles now come to your team page, not the job board. You’ll hear about new ones here.',
              nextLabel: 'Show me',
              onNext: () => setPlace('team'),
              radius: 8,
            },
            {
              target: COUNT_LINE,
              title: 'Candidates, under each role',
              body: 'Only your team’s leads see this line. It opens everyone who applied, across all your roles.',
              /* The line's own press, so the page opens on the role the hole
                 was around. `click()` sends no pointerdown, which is what rule
                 6 listens for — the tour walks on instead of ending. */
              onNext: () => {
                document.querySelector<HTMLElement>(COUNT_LINE)?.click();
                /* The candidates page takes the profile's place at the
                   profile's scroll position; a new page starts at its top.
                   (This app scrolls the body.) */
                document.body.scrollTo({ top: 0 });
                window.scrollTo({ top: 0 });
              },
              radius: 8,
            },
            /* A phone shows one column at a time, so the pane bar is not there
               until a row is opened: the last step stands on the list instead
               and says the same two things. */
            isMobile
              ? {
                  target: '[data-tour="candidate-list"]',
                  title: 'Open anyone to read their application',
                  body: 'New ones are tinted until you open them. You reply by email, and Reviewed is your own tick: the candidate never sees it.',
                  radius: 10,
                }
              : {
                  target: '[data-tour="candidate-actions"]',
                  title: 'Reply by email, keep your place',
                  body: 'Email opens a message in your own mail. Reviewed is your own tick: the candidate never sees it.',
                  radius: 10,
                },
          ],
    [tour, askAi, isMobile],
  );

  const restart = useCallback(() => {
    closeAi();
    setPlace('home');
    setRun((n) => n + 1);
    setTourOpen(true);
  }, [closeAi]);

  const pickTour = (id: TourId) => {
    setTour(id);
    restart();
  };

  const seatLabel = (value: AiSearchViewer) =>
    value === 'member' ? 'Member' : tour === 'candidates' ? 'Team lead' : 'Founder';

  const reviewExtras = (
    <div className={clsx(v0.switchBar, s.tourControls)}>
      <span className={v0.switchLabel}>Tour</span>
      <div className={v0.switch} role="tablist" aria-label="Tour">
        {TOURS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tour === id}
            className={clsx(v0.switchBtn, tour === id && v0.switchBtnActive)}
            onClick={() => pickTour(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <span className={v0.switchLabel}>Signed in as</span>
      <div className={v0.switch} role="tablist" aria-label="Seat">
        {(['founder', 'member'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={seat === value}
            className={clsx(v0.switchBtn, seat === value && v0.switchBtnActive)}
            onClick={() => setSeat(value)}
          >
            {seatLabel(value)}
          </button>
        ))}
      </div>
      <Button size="xs" style="border" variant="neutral" onClick={restart}>
        Replay tour
      </Button>
      <span className={v0.switchNote}>
        {seat === 'member'
          ? 'Members get no tour: what it shows is not on their pages.'
          : tour === 'candidates'
            ? 'Opens on a lead’s first arrival after someone applies. One tour per arrival: this one goes before Warm intros.'
            : 'The tour is for founders; it opens on arrival.'}
      </span>
    </div>
  );

  /* The bell's dot is the feature's standing signal, not the tour's: it is
     there for a lead with unread candidates whether or not the tour is up. */
  const bellDot = tour === 'candidates' && eligible;

  return (
    <AiSearchViewerContext.Provider value={seat}>
      {place === 'home' ? (
        <>
          <NewsfeedPrototype
            navExtras={{ ...host.navProps, bellDot }}
            helpCallout={false}
            reviewExtras={reviewExtras}
            onSignedInChange={setSignedIn}
          />
          {host.layers}
        </>
      ) : (
        <>
          <PrototypeNavBar hasUnreadNews={false} newsHref="/prototypes/guided-tour" onNewsClick={restart} bellDot={bellDot} />
          {/* `--candidates-top`: the candidates page's sticky list and bar clear
              the navbar mounted above them here (the job board's own rule). */}
          <div className={s.teamHost}>
            <TeamProfilePrototype newsCallout={false} />
          </div>
          {/* The review band went with the homepage; this is its Replay. */}
          <div className={s.replayDock}>
            <Button size="xs" style="border" variant="neutral" onClick={restart}>
              Replay tour
            </Button>
          </div>
        </>
      )}
      <GuidedTour
        key={`${tour}-${run}`}
        feature={TOURS.find((t) => t.id === tour)!.feature}
        steps={steps}
        open={tourOpen && eligible}
        onEnd={() => setTourOpen(false)}
      />
    </AiSearchViewerContext.Provider>
  );
}
