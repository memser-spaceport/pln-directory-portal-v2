'use client';

import React, { useEffect, useRef } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';

// The product's callout tooltip — the brand-blue `highlight` variant of the
// core Tooltip, reused by its stylesheet rather than through the component,
// because that component only opens on hover and this one has to open on
// arrival. Same move team-profile's PostNewsButton makes.
import tip from '@/components/core/tooltip/tooltip.module.css';

import { HelpIcon } from '../icons';

import s from './HelpMenu.module.scss';

/** Once per member, across devices — the record lives on the member row, with
 *  IndexedDB in front of it as a cache. Signed-out visitors still see the (?),
 *  and for them the local flag is the only record there can be. */
const CALLOUT_KEY = 'help_callout';

type DismissedVia = 'got-it' | 'escape' | 'modal-opened';

interface Props {
  userInfo?: IUserInfo;
}

/**
 * The header's (?) — the network's global help and feedback door.
 *
 * One click opens the Contact Support form on its first topic. No menu: for one
 * day it listed the five `CONTACT_SUPPORT_TOPICS` in front of the form, which
 * was half of the answer to a discovery problem (PostHog, 90 days: 605 modal
 * opens, 12 on a non-default topic — nobody looking to give feedback found out
 * the (?) was where feedback lived).
 *
 * The other half was moving the topics out from behind a `Dropdown` *inside*
 * the form and onto a pill row, where all five sit at rest. That is the half
 * that fixes it, and it makes the menu redundant: a list of five topics in
 * front of a form showing the same five topics is a second click to reach what
 * was already on screen. `contact-support.test.tsx` holds the guarantee that
 * they are all visible there — "puts every topic on screen at rest, rather than
 * behind a press".
 *
 * So the (?) behaves like its neighbours again. The row's other icon buttons —
 * search, the notification bell — open their thing on a press, and this one now
 * does too.
 */
export const HelpMenu = ({ userInfo }: Props) => {
  const analytics = useCommonAnalytics();
  const { openModal } = useContactSupportStore((store) => store.actions);

  // Both answers — local cache and member record — are resolved in here, which
  // is also why the callout can still only appear a tick after mount: that
  // delay is what stops it flashing for members who dismissed it long ago.
  const { open: calloutOpen, dismiss: dismissFlag } = useOneTimeCallout(CALLOUT_KEY);

  // A ref rather than a dependency, for the reason the Home news dot uses one:
  // `useCommonAnalytics()` hands back a fresh object every render, so an effect
  // that depended on it would report an impression per render.
  const shownReportedRef = useRef(false);
  useEffect(() => {
    if (shownReportedRef.current || !calloutOpen) {
      return;
    }
    shownReportedRef.current = true;
    analytics.onHelpCalloutShown(getAnalyticsUserInfo(userInfo));
  }, [analytics, calloutOpen, userInfo]);

  const dismissCallout = (via: DismissedVia) => {
    // Guarded so a second dismissal — Escape after Got it, or the modal opening
    // when there was no callout to begin with — neither double-counts nor
    // rewrites a flag that is already set.
    if (!calloutOpen) {
      return;
    }
    analytics.onHelpCalloutDismissed(via, getAnalyticsUserInfo(userInfo));
    dismissFlag();
  };

  const handleClick = () => {
    analytics.onHelpMenuOpened(getAnalyticsUserInfo(userInfo));
    // The form is the thing the callout was announcing, so arriving at it is
    // the announcement landing rather than being ignored.
    dismissCallout('modal-opened');
    // Named rather than left to `openModal`'s default, which is the same value
    // today: "opens on Contact support" is the requirement, so the call site is
    // where it should be legible, and it survives the default changing.
    openModal(undefined, 'contactSupport');
  };

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root open={calloutOpen}>
        {/* A span rather than the button via `asChild`: the button carries its
            own class and handler, and letting Radix's Slot merge onto it is one
            library reaching into a node that is simpler left alone. */}
        <TooltipPrimitive.Trigger asChild>
          <span className={s.anchor}>
            <button type="button" className={s.trigger} onClick={handleClick} aria-label="Help and feedback">
              <HelpIcon />
            </button>
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="bottom"
            align="end"
            sideOffset={8}
            // Radix mirrors the children into a hidden role="tooltip" node;
            // an aria-label replaces that copy with text, so "Got it" is not
            // announced twice.
            aria-label="You can give feedback, report a bug or contact support here."
            className={clsx(tip.tp, tip['tp--highlight'], s.calloutTip)}
            onEscapeKeyDown={() => dismissCallout('escape')}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            {/* The three verbs are the form's own topics, so the hint and the
                room it announces say the same words. */}
            <p className={s.calloutText}>You can give feedback, report a bug or contact support here.</p>
            <button type="button" className={s.calloutDismiss} onClick={() => dismissCallout('got-it')}>
              Got it
            </button>
            <TooltipPrimitive.Arrow className={tip['tp__arrow--highlight']} width={14} height={7} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
