'use client';

/**
 * REUSE MAP
 *
 * IMPORTED (prototype folders, nothing redrawn):
 *  - NewsfeedPrototype            the homepage itself, through its optional host props
 *  - useAiSearchHost              ai-search's popover + AI view, wired into that page's header
 *  - InvestorPathRow               the founder's intro rows; they carry the `data-tour` anchors
 *  - GuidedTour                   tour-shared — the standard object this entry demonstrates
 *  - newsfeed-v0 switch chrome    the review band's own switch classes
 *  - Button                       @/components/common/Button
 *
 * NEW: only the three steps below. The tour's rules live in GuidedTour.tsx.
 */

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';

import NewsfeedPrototype from '../newsfeed/NewsfeedPrototype';
import { useAiSearchHost } from '../ai-search/useAiSearchHost';
import { AiSearchViewerContext, type AiSearchViewer } from '../ai-search/viewer';
import { INVESTORS_QUESTION } from '../ai-search/mocks';
import { SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { GuidedTour, type TourStep } from '../tour-shared/GuidedTour';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import s from './GuidedTourPrototype.module.scss';

/**
 * Guided tour, first use: warm intros for founders in AI Search, met on Home.
 *
 * The feature lives two screens away from where a session starts — inside an
 * AI Search answer — so a callout on the header field could name it but not
 * show it. The tour starts on the field, asks the investor question for the
 * founder ("Show me"), waits for the answer to land, and ends on the press
 * that matters. Founders only: a member's answer has no intro rows, so a
 * member has no tour (flip the seat in the review band to check).
 */
export default function GuidedTourPrototype() {
  const [seat, setSeat] = useState<AiSearchViewer>('founder');
  const [signedIn, setSignedIn] = useState(true);
  // PROTOTYPE: open on every load; production shows it once per member.
  const [tourOpen, setTourOpen] = useState(true);

  const host = useAiSearchHost(seat);
  const { askAi, closeAi } = host;

  const steps = useMemo<TourStep[]>(
    () => [
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
    ],
    [askAi],
  );

  const replay = useCallback(() => {
    closeAi();
    setTourOpen(true);
  }, [closeAi]);

  const reviewExtras = (
    <div className={clsx(v0.switchBar, s.tourControls)}>
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
            {value === 'founder' ? 'Founder' : 'Member'}
          </button>
        ))}
      </div>
      <Button size="xs" style="border" variant="neutral" onClick={replay}>
        Replay tour
      </Button>
      <span className={v0.switchNote}>
        {seat === 'founder' ? 'The tour is for founders; it opens on arrival.' : 'Members get no tour: the rows it shows are not in their answers.'}
      </span>
    </div>
  );

  return (
    <AiSearchViewerContext.Provider value={seat}>
      <NewsfeedPrototype
        navExtras={host.navProps}
        helpCallout={false}
        reviewExtras={reviewExtras}
        onSignedInChange={setSignedIn}
      />
      {host.layers}
      <GuidedTour
        feature="AI Search"
        steps={steps}
        open={tourOpen && signedIn && seat === 'founder'}
        onEnd={() => setTourOpen(false)}
      />
    </AiSearchViewerContext.Provider>
  );
}
