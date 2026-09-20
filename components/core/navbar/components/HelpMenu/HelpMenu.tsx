'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { useMedia } from 'react-use';

import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useContactSupportStore } from '@/services/contact-support/store';
import { CONTACT_SUPPORT_TOPICS, type IContactSupportTopic } from '@/components/ContactSupport/constants';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';

// The header's own menu chrome (the account menu, two seats along this row):
// positioner, popup, items. Imported rather than copied, so the two menus in
// one row cannot drift apart.
import menu from '@/components/core/navbar/components/AccountMenu/AccountMenu.module.scss';
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

type DismissedVia = 'got-it' | 'escape' | 'menu-opened' | 'modal-opened';

interface Props {
  userInfo?: IUserInfo;
  isLoggedIn?: boolean;
}

/**
 * The header's (?) — the network's global help and feedback door.
 *
 * What it opens depends on what the device can do, because the two inputs are
 * not the same gesture:
 *
 * - Where there is a cursor, hovering shows the five `CONTACT_SUPPORT_TOPICS`,
 *   the way the bar's left half (Directory, Events, More) already answers a
 *   cursor passing over it, and a press goes straight to the support form on
 *   its first topic. Someone who takes the time to hover gets the list; someone
 *   who just presses gets the room, where the same five topics sit on a pill
 *   row at rest — `contact-support.test.tsx` holds that guarantee. Nobody is
 *   made to click twice for something they can already see.
 * - On touch there is no hover, so the list has nowhere else to live: the tap
 *   opens it, like the other nested tabs in this bar, and the topic picked
 *   there opens the form already on it.
 *
 * `(hover: hover)` rather than a width, because this is a question about the
 * pointer, not about the viewport — and it is the same query `.trigger`'s hover
 * background is already asking.
 *
 * Items are text-only, unlike the account menu's icon column: the icon set has
 * no glyph for "bug" or "idea", and inventing three so the column looks
 * complete is a design-system decision, not this component's.
 */
export const HelpMenu = ({ userInfo, isLoggedIn }: Props) => {
  const analytics = useCommonAnalytics();
  const { openModal } = useContactSupportStore((store) => store.actions);
  const supportFormOpen = useContactSupportStore((store) => store.open);

  const canHover = useMedia('(hover: hover)', false);
  // Controlled, because base-ui's own answer to a press is not the one we want
  // on a cursor device: it would open the list, and when the list is already
  // hover-open its `stickIfOpen` would keep it there for the first 500ms rather
  // than let the press close it — leaving a menu standing over the form.
  const [menuOpen, setMenuOpen] = useState(false);

  // Both answers — local cache and member record — are resolved in here, which
  // is also why the callout can still only appear a tick after mount: that
  // delay is what stops it flashing for members who dismissed it long ago.
  const { open: calloutReady, dismiss: dismissFlag } = useOneTimeCallout(CALLOUT_KEY);

  /* Members only. The (?) is in the header for signed-out visitors too and the
     support form works without a session, so the sentence is true for them —
     but it is an unprompted interruption to someone who has not signed in yet,
     and they have the sign-up flow in the same row competing for that attention.
     Gated here rather than inside `useOneTimeCallout`, because this is one
     callout's decision: the hook's other two callers are on pages that already
     require a session, and one of them might one day want the opposite.
     `isLoggedIn` arrives from the server-rendered cookie state, so it is settled
     on the first paint and this cannot flash. `Boolean()` is for the type, not
     the behaviour: `isLoggedIn` has historically been `''` rather than `false`
     here, and `'' && x` is already falsy — this just stops that `''` reaching
     `open=`, which wants a boolean. */
  const calloutOpen = Boolean(isLoggedIn) && calloutReady;

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
    // Guarded so a second dismissal — Escape after Got it, or a press when
    // there was no callout to begin with — neither double-counts nor rewrites a
    // flag that is already set.
    if (!calloutOpen) {
      return;
    }
    analytics.onHelpCalloutDismissed(via, getAnalyticsUserInfo(userInfo));
    dismissFlag();
  };

  const handleOpenChange = (open: boolean, details: Menu.Root.ChangeEventDetails) => {
    if (open && canHover && details.reason === 'trigger-press') {
      // The press belongs to the form — `handleTriggerClick` has it. Keyboard
      // activation arrives as a press too, so Enter on the (?) opens the form
      // rather than a list the keyboard would then have to walk; the topics are
      // all on screen once it is open.
      return;
    }
    setMenuOpen(open);
    if (open) {
      // Including a hover-open: the list is the thing the callout was
      // announcing, and a tip sitting on top of it is the announcement in the
      // way of what it announced.
      dismissCallout('menu-opened');
      if (details.reason === 'trigger-press') {
        // Only a deliberate press counts as the door being used — on a cursor
        // device the opens that reach here are hovers, and counting those would
        // drown the series this event exists for.
        analytics.onHelpMenuOpened(getAnalyticsUserInfo(userInfo));
      }
    }
  };

  const handleTriggerClick = () => {
    if (!canHover) {
      // Touch: the tap opened the list, and the form is one item away.
      return;
    }
    // A hover may have put the list on screen a moment ago; the press has been
    // answered by the form, so the list has nothing left to say.
    setMenuOpen(false);
    analytics.onHelpMenuOpened(getAnalyticsUserInfo(userInfo));
    dismissCallout('modal-opened');
    // Named rather than left to `openModal`'s default, which is the same value
    // today: "opens on Contact support" is the requirement, so the call site is
    // where it should be legible, and it survives the default changing.
    openModal(undefined, 'contactSupport');
  };

  const handleTopicClick = (topic: IContactSupportTopic) => {
    // The existing `navbar-get-help-item-clicked` series, whose `name` has
    // always carried the item label — so the topics join a stream that already
    // has history rather than starting a parallel one.
    analytics.onNavGetHelpItemClicked(topic.label, getAnalyticsUserInfo(userInfo));
    openModal(undefined, topic.dialogParam);
  };

  return (
    <Menu.Root
      modal={false}
      // Off while the form is up: the hover that opens this list only has to
      // rest for `delay`, and that timer can still be running when a press
      // opens the form — an unasked-for menu behind the modal.
      openOnHover={canHover && !supportFormOpen}
      delay={120}
      open={menuOpen}
      onOpenChange={handleOpenChange}
    >
      <TooltipPrimitive.Provider delayDuration={0}>
        <TooltipPrimitive.Root open={calloutOpen}>
          {/* A span, not the trigger via `asChild`: `Menu.Trigger` already takes
              a ref and data attributes from base-ui, and stacking Radix's Slot
              on top of that is two libraries arguing over one node. */}
          <TooltipPrimitive.Trigger asChild>
            <span className={s.anchor}>
              <Menu.Trigger className={s.trigger} aria-label="Help and feedback" onClick={handleTriggerClick}>
                <HelpIcon />
              </Menu.Trigger>
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

      <Menu.Portal>
        <Menu.Positioner className={menu.Positioner} align="end" sideOffset={10}>
          <Menu.Popup className={clsx(menu.Popup, s.popup)}>
            {CONTACT_SUPPORT_TOPICS.map((topic) => (
              <Menu.Item key={topic.dialogParam} className={menu.Item} onClick={() => handleTopicClick(topic)}>
                {topic.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
