'use client';

/**
 * REUSE MAP
 *
 * IMPORTED (read-only, production):
 *  - AccountMenu.module.scss      the header's menu chrome (popup, item, separators)
 *  - NavBar.module.scss           `.supportButton` — the (?)'s 40px box in the row
 *  - tooltip.module.css           the core Tooltip's `highlight` variant, for the callout
 *  - SearchCategories.module.scss production's single-select pill row, for the topics
 *  - ContactSupport.module.scss   the modal's width and editor fixes
 *  - CONTACT_SUPPORT_TOPICS       the five topics — one constant feeds menu, pills, title
 *  - ModalBase, FormLabel, LabeledInput, FormEditor, toast, QuestionCircleIcon, HelpIcon
 *  - @base-ui-components Menu (openOnHover), @radix-ui/react-tooltip (controlled open)
 *
 * COPY-SIMPLIFIED (in this folder):
 *  - SupportModal   ← components/ContactSupport/ContactSupport.tsx (store, URL sync,
 *                     image hosting and the auth-reason descriptions dropped)
 *
 * SHARED (prototypes/entries/nav-shared/):
 *  - PrototypeNavBar, now with an opt-in `helpMenu` slot
 *  - HelpFeedbackMenu (new) — the proposal, argued in that file
 *
 * PAGE BODY: the members listing prototype, unchanged — a global control needs
 * a real page under it. The page a session actually starts on is Home
 * (`/` redirects to `/home`), so the newsfeed entry mounts the same menu and
 * callout in its header; this entry is where the demo switches live.
 */

import { useState } from 'react';
import clsx from 'clsx';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import MembersPrototype from '../members/MembersPrototype';
// Reuse the newsfeed prototypes' switch chrome so prototype-only controls look
// the same across entries (job-board, newsfeed, newsfeed-discovery import it too).
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { SupportModal } from './SupportModal';
import { MOCK_VIEWER } from './mocks';
import s from './HelpFeedbackMenuPrototype.module.scss';

export default function HelpFeedbackMenuPrototype() {
  // null = closed; otherwise the topic the menu was left on.
  const [topic, setTopic] = useState<string | null>(null);
  // Demo switches for the two open questions, not part of the proposal.
  const [askAi, setAskAi] = useState(false);
  const [callout, setCallout] = useState(true);

  return (
    <div className={s.page}>
      <PrototypeNavBar
        hasUnreadNews={false}
        newsHref="/prototypes/newsfeed"
        searchable
        // `key` remounts the menu when the callout switch flips back on, so the
        // announcement reopens instead of staying dismissed from the last look.
        helpMenu={{ key: callout ? 'callout' : 'quiet', onPickTopic: setTopic, askAi, callout }}
      />

      {/* Demo-only. Sits under the header rather than above it so the members
          page's sticky filter rail still starts at the header it offsets for. */}
      <div className={clsx(v0.switchBar, s.demoBar)}>
        <span className={v0.switchLabel}>Demo</span>
        <span className={s.demoGroup}>
          <span className={v0.switchNote}>“Ask AI” item</span>
          <span className={v0.switch}>
            <button
              type="button"
              className={clsx(v0.switchBtn, !askAi && v0.switchBtnActive)}
              onClick={() => setAskAi(false)}
            >
              Off
            </button>
            <button
              type="button"
              className={clsx(v0.switchBtn, askAi && v0.switchBtnActive)}
              onClick={() => setAskAi(true)}
            >
              On
            </button>
          </span>
        </span>
        <span className={s.demoGroup}>
          <span className={v0.switchNote}>First-visit callout</span>
          <span className={v0.switch}>
            <button
              type="button"
              className={clsx(v0.switchBtn, callout && v0.switchBtnActive)}
              onClick={() => setCallout(true)}
            >
              On
            </button>
            <button
              type="button"
              className={clsx(v0.switchBtn, !callout && v0.switchBtnActive)}
              onClick={() => setCallout(false)}
            >
              Off
            </button>
          </span>
        </span>
        <span className={v0.switchNote}>Hover or press the (?) in the header.</span>
      </div>

      <MembersPrototype />

      <SupportModal
        open={topic !== null}
        initialTopic={topic ?? 'Contact support'}
        viewer={MOCK_VIEWER}
        onClose={() => setTopic(null)}
      />
    </div>
  );
}
