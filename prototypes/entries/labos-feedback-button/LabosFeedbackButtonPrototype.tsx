'use client';

/**
 * REUSE MAP — labos-feedback-button (one "Give feedback" door on every LabOS page)
 *
 * Ask (Anuj, 2026-10-15): take the AI Apps feedback experience and make it
 * available across LabOS, behind one button — possibly in the global nav,
 * labelled "Give feedback". Two placements to compare, on Home:
 *   - Navbar: a labelled button in the header's right cluster, before the (?).
 *   - Floating: AI Apps' own floating pill, bottom-right.
 * Both open the same drawer. The (?) stays develop's HelpMenu (hover: the five
 * topics; click: the support form on Contact support), opening production's
 * support form — ContactSupportModal, copied with a mocked send.
 *
 * IMPORTED:
 *  - newsfeed: the whole Home page (host props: navExtras, reviewExtras,
 *    onSignedInChange); newsfeed-v0's review-band switch classes
 *  - nav-shared/PrototypeNavBar: opt-in `feedbackButton` (added for this entry)
 *  - home-ai-ask/useHeaderSearch: the header search as production has it — the
 *    field in the row (36px, 200–600px) with the AI badge inside it, opening
 *    AI Search. Its `jobsInBar` is turned back off: production's nav items.
 *  - production: capturePageViewport / scrollPage / FEEDBACK_CAPTURE_IGNORE_ATTR
 *    (the AI Apps list's own page screenshot), FloatingFeedbackButton.module.scss,
 *    the open-feedback shortcut, CommentIcon
 *
 * COPIED (feedback/): ai-apps-feedback-drawer/prod — the drawer form as the
 * AI Apps prototype has it — with a `page` mode marked `Page:` in
 * FeedbackDialog.tsx (no app picker, "About this page · Home", page copy,
 * viewport Pick a part).
 */

import React, { useState } from 'react';
import clsx from 'clsx';

import NewsfeedPrototype from '../newsfeed/NewsfeedPrototype';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { MOCK_VIEWER } from '../help-feedback-menu/mocks';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { CONTACT_SUPPORT_TOPICS } from '@/components/ContactSupport/constants';

import { ContactSupportModal } from './ContactSupportModal';

import { FloatingPageFeedbackButton, PageFeedbackDrawer, usePageFeedback } from './feedback/PageFeedback';
import { HOME_PAGE, PLACEMENTS, type Placement } from './mocks';

const VIEWER = { uid: 'viewer-pb', ...MOCK_VIEWER };

function Switch<T extends string>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  options: { value: T; label: string; note: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>{label}</span>
      <div className={v0.switch} role="tablist" aria-label={ariaLabel}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={v0.switchNote}>{options.find((o) => o.value === value)!.note}</span>
    </div>
  );
}

export default function LabosFeedbackButtonPrototype() {
  const [placement, setPlacement] = useState<Placement>('navbar');
  /* A member's door: signed out there is nobody to post as, so neither placement shows. */
  const [signedIn, setSignedIn] = useState(true);
  const feedback = usePageFeedback();
  const inBar = placement === 'navbar';
  const headerSearch = useHeaderSearch(signedIn);
  /* The (?) is develop's HelpMenu: hover lists the five topics, a click opens
     the form on its first one, and each opens production's form (copied). */
  const [supportTopic, setSupportTopic] = useState<string | null>(null);

  return (
    <>
      <NewsfeedPrototype
        /* The (?) callout announces support on arrival; one announcement a load. */
        helpCallout={false}
        onSignedInChange={setSignedIn}
        navExtras={{
          ...headerSearch,
          jobsInBar: false,
          helpMenu: {
            onPickTopic: setSupportTopic,
            callout: false,
            clickTopic: CONTACT_SUPPORT_TOPICS[0].value,
            strokeGlyph: true,
          },
          feedbackButton: signedIn ? { onClick: feedback.open, expanded: feedback.isOpen, inBar } : undefined,
        }}
        reviewExtras={
          <Switch
            label="Feedback button"
            ariaLabel="Where the feedback button lives"
            options={PLACEMENTS}
            value={placement}
            onChange={setPlacement}
          />
        }
      />

      <ContactSupportModal
        topic={supportTopic}
        onClose={() => setSupportTopic(null)}
        viewer={signedIn ? VIEWER : undefined}
      />
      {signedIn && !inBar && <FloatingPageFeedbackButton isOpen={feedback.isOpen} onOpen={feedback.open} />}
      {signedIn && (
        <PageFeedbackDrawer isOpen={feedback.isOpen} onClose={feedback.close} page={HOME_PAGE} viewer={VIEWER} />
      )}
    </>
  );
}
