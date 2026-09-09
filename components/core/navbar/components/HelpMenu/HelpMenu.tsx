'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useContactSupportStore } from '@/services/contact-support/store';
import { CONTACT_SUPPORT_TOPICS, type IContactSupportTopic } from '@/components/ContactSupport/constants';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

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

/** Per member, per browser — `uiFlags` is IndexedDB, so a second device gets
 *  its own answer. Signed-out visitors see the (?) too and share one key. */
const calloutKey = (uid?: string) => `help_callout_dismissed_${uid ?? 'anon'}`;

type DismissedVia = 'got-it' | 'escape' | 'menu-opened';

interface Props {
  userInfo?: IUserInfo;
}

/**
 * The header's (?) — the network's global help and feedback door.
 *
 * It used to be a bare `<svg onClick>` that opened the Contact Support modal on
 * its default topic, with the other four topics behind a dropdown *inside* that
 * modal. PostHog, trailing 90 days: 605 opens, 12 of them on a non-default
 * topic. Nobody who wanted to give feedback found out that the (?) was where
 * feedback lived.
 *
 * So the topics moved out of the modal and in front of it. The items here are
 * `CONTACT_SUPPORT_TOPICS` — the same list the form's pill row renders and the
 * same list `?dialog=` deep links resolve against — so the door and the room
 * can never disagree about what is on offer. Each item opens the form already
 * on its topic, which is exactly what `?dialog=giveFeedback` already did; this
 * menu is that deep link with a label on it.
 *
 * It opens on hover as well as on click, because the bar's left half
 * (Directory, Events, More) already does and a cursor passing over the (?)
 * should get the same answer those give. On touch there is no hover and the tap
 * does what it always did, except that it now lands on a list instead of a
 * form. No chevron: the row's other icon buttons (search, bell) carry none, and
 * the hover is the disclosure.
 *
 * Items are text-only, unlike the account menu's icon column: the icon set has
 * no glyph for "bug" or "idea", and inventing three so the column looks
 * complete is a design-system decision, not this component's.
 */
export const HelpMenu = ({ userInfo }: Props) => {
  const analytics = useCommonAnalytics();
  const { openModal } = useContactSupportStore((store) => store.actions);
  const uid = userInfo?.uid;

  const [calloutOpen, setCalloutOpen] = useState(false);

  // `getUiFlag` is async (IndexedDB), so the callout can only appear a tick
  // after mount — which is exactly what stops it flashing for the members who
  // dismissed it long ago.
  useEffect(() => {
    let cancelled = false;

    getUiFlag(calloutKey(uid)).then((dismissed) => {
      if (!cancelled && !dismissed) {
        setCalloutOpen(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

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
    // Guarded so a second dismissal — Escape after Got it, or the menu opening
    // when there was no callout to begin with — neither double-counts nor
    // rewrites a flag that is already set.
    if (!calloutOpen) {
      return;
    }
    setCalloutOpen(false);
    analytics.onHelpCalloutDismissed(via, getAnalyticsUserInfo(userInfo));
    void setUiFlag(calloutKey(uid));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      return;
    }
    analytics.onHelpMenuOpened(getAnalyticsUserInfo(userInfo));
    // The menu is the thing the callout was announcing, so arriving at it is
    // the announcement landing rather than being ignored.
    dismissCallout('menu-opened');
  };

  const handleTopicClick = (topic: IContactSupportTopic) => {
    // The existing `navbar-get-help-item-clicked` series, whose `name` has
    // always carried the item label — so the topics join a stream that already
    // has history rather than starting a parallel one.
    analytics.onNavGetHelpItemClicked(topic.label, getAnalyticsUserInfo(userInfo));
    openModal(undefined, topic.dialogParam);
  };

  return (
    <Menu.Root modal={false} openOnHover delay={120} onOpenChange={handleOpenChange}>
      <TooltipPrimitive.Provider delayDuration={0}>
        <TooltipPrimitive.Root open={calloutOpen}>
          {/* A span, not the trigger via `asChild`: `Menu.Trigger` already takes
              a ref and data attributes from base-ui, and stacking Radix's Slot
              on top of that is two libraries arguing over one node. */}
          <TooltipPrimitive.Trigger asChild>
            <span className={s.anchor}>
              <Menu.Trigger className={s.trigger} aria-label="Help and feedback">
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
              {/* The three verbs are the menu's own item labels, so the hint and
                  the list it announces say the same words. */}
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
