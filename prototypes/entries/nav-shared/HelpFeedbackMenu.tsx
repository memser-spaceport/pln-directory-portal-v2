'use client';

import { useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { CONTACT_SUPPORT_TOPICS } from '@/components/ContactSupport/constants';
import { HelpIcon } from '@/components/core/navbar/components/icons';

// The header's own menu chrome (account menu): popup, items, group separators.
// Imported, not copied, so the two menus in this row cannot drift.
import menu from '@/components/core/navbar/components/AccountMenu/AccountMenu.module.scss';
import nav from '@/components/core/navbar/NavBar.module.scss';
// The product's callout tooltip — the brand-blue `highlight` variant of the
// core Tooltip, reused by its stylesheet because that component only opens on
// hover and this one has to open on arrival (same move as team-profile's
// PostNewsButton).
import tip from '@/components/core/tooltip/tooltip.module.css';

import local from './HelpFeedbackMenu.module.scss';

export interface HelpFeedbackMenuProps {
  /** A topic was chosen — open the support form on it. Values are the
   *  production `CONTACT_SUPPORT_TOPICS` values, so they feed the same form. */
  onPickTopic: (topic: string) => void;
  /** Present → an "Ask AI" item renders under the topics. Juan's "maybe". */
  onAskAi?: () => void;
  /** One-time announcement on arrival, anchored to the (?). */
  callout?: boolean;
}

/**
 * The header's (?) — proposal for the global feedback entry point.
 *
 * Today the (?) is a bare icon that opens the Contact Support modal on its
 * default topic, and the other four topics live in a dropdown inside that
 * modal. PostHog, last 90 days: the modal opened in 605 sessions, and in 12 of
 * them the topic was anything but the default. Juan's read ("people don't look
 * inside dropdowns") is what the numbers say — nobody who wanted to give
 * feedback found out that the (?) was where feedback lived.
 *
 * So the topics move out of the modal and in front of it. The (?) becomes a
 * menu, and the menu's items ARE the modal's topic list — one constant feeds
 * both, so the door and the room never disagree about what is on offer. Each
 * item opens the form already on that topic, which is exactly what the
 * `?dialog=giveFeedback` deep link does today (`DIALOG_TO_TOPIC_MAP`); the
 * menu is that deep link with a label on it.
 *
 * It opens on hover as well as on click. The bar's left half (Directory,
 * Events, More) already opens on hover, so a cursor passing over the (?) gets
 * the same answer those get — the contents, with no press spent. On touch
 * there is no hover and the tap does what it always did, except that it now
 * lands on a list instead of a form. No chevron: the bar's other icon buttons
 * (search, bell) carry none, and the hover is the disclosure.
 *
 * The product had this shape once — `HelpMenu` (a lifesaver icon over
 * ProtoSphere / Get Support / Changelog, base-ui Menu) — and dropped it for the
 * single (?) when the Contact Support modal shipped (LAB-698, LAB-1099). The
 * account menu still carries a "Get Support" item under a "Support" header:
 * 5 clicks in 90 days. Once the (?) is a labelled door, that duplicate should go.
 *
 * Items are text-only, unlike the account menu's icon column: the icon set has
 * no glyph for "bug" or "idea", and inventing three so the column is complete
 * is a design-system decision, not this prototype's. Better none than a column
 * that is two-fifths made up.
 */
export function HelpFeedbackMenu({ onPickTopic, onAskAi, callout = false }: HelpFeedbackMenuProps) {
  // PROTOTYPE: the callout opens on every page load and is never persisted as
  // dismissed — reviewers should meet it each time. In production dismissal
  // would be a member preference, so a member sees it once. It also closes
  // the moment the menu opens: the menu is the thing it was announcing.
  const [tipOpen, setTipOpen] = useState(callout);
  const dismiss = () => setTipOpen(false);

  return (
    <Menu.Root modal={false} openOnHover delay={120} onOpenChange={(open) => open && dismiss()}>
      <TooltipPrimitive.Provider delayDuration={0}>
        <TooltipPrimitive.Root open={tipOpen}>
          {/* A span, not the trigger via asChild: the Menu.Trigger already
              takes a ref and data attributes from base-ui, and stacking Radix's
              Slot on top of that is two libraries arguing over one node. */}
          <TooltipPrimitive.Trigger asChild>
            <span className={local.anchor}>
              <Menu.Trigger className={clsx(nav.supportButton, local.trigger)} aria-label="Help and feedback">
                <HelpIcon />
              </Menu.Trigger>
            </span>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="bottom"
              align="end"
              sideOffset={8}
              // Radix re-renders the children into a hidden role="tooltip"
              // node; an aria-label replaces that copy with text so "Got it"
              // is not read twice.
              aria-label="You can give feedback, report a bug or contact support here."
              className={clsx(tip.tp, tip['tp--highlight'], local.calloutTip)}
              onEscapeKeyDown={dismiss}
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              {/* The three verbs are the menu's own item labels, so the hint and
                  the list it announces say the same words. */}
              <p className={local.calloutText}>You can give feedback, report a bug or contact support here.</p>
              <button type="button" className={local.calloutDismiss} onClick={dismiss}>
                Got it
              </button>
              <TooltipPrimitive.Arrow className={tip['tp__arrow--highlight']} width={14} height={7} />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>

      <Menu.Portal>
        <Menu.Positioner className={menu.Positioner} align="end" sideOffset={10}>
          <Menu.Popup className={clsx(menu.Popup, local.popup)}>
            {/* The modal's own list, in the modal's own order — the menu is a
                door to that form, so it offers exactly what the form offers. */}
            {CONTACT_SUPPORT_TOPICS.map((topic) => (
              <Menu.Item key={topic.value} className={menu.Item} onClick={() => onPickTopic(topic.value)}>
                {topic.label}
              </Menu.Item>
            ))}

            {onAskAi && (
              <>
                <div className={menu.SeparatorWrapper}>
                  AI
                  <Menu.Separator className={menu.Separator} />
                </div>
                {/* A different destination from the five above — the search
                    overlay's AI chat, which answers from the directory rather
                    than from a person — so it sits in its own group and says
                    what it answers, since "Ask AI" alone promises anything. */}
                <Menu.Item className={menu.Item} onClick={onAskAi}>
                  Ask AI <span className={menu.itemSub}>About the network</span>
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
