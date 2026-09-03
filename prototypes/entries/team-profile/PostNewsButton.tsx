'use client';

import { useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { PlusIcon } from '@/components/icons';

// The product's callout tooltip — the brand-blue `highlight` variant of the
// core Tooltip (rights-tokens dashboard), reused by its stylesheet because that
// component only opens on hover and this one has to open on arrival.
import tip from '@/components/core/tooltip/tooltip.module.css';
import local from './TeamProfile.module.scss';

interface Props {
  teamName: string;
  onPost: () => void;
}

/**
 * The rail's "Post news" — a small filled primary button in the corner of the
 * news block, with a one-time callout announcing it.
 *
 * The button is the section's only action, so it takes the section's corner —
 * the slot every profile section keeps for one — and it's filled because a
 * link-style action there was invisible beside this panel's blue title, and a
 * bordered one crowded a 340px header. The DS tertiary — the text button, `style="link"`, the
 * same rank as every section's Edit — and it can afford to be, because the
 * callout below carries the noticing: primary was a step too loud for a side
 * rail, secondary (bordered) still argued with the page's own actions, and
 * once a feature is announced on arrival the control only has to be findable,
 * not loud. Note the DS has no filled secondary (that pair renders white on
 * white); its secondary is `style="border"`.
 *
 * The callout is how a feature that is new gets found: it opens on arrival,
 * anchored to the button, and stays until "Got it" or the button itself is
 * pressed. It is the core Tooltip's `highlight` variant (brand blue, arrow,
 * 14px radius) composed from the same Radix primitive with a controlled `open`,
 * since the production component only opens on hover. One sentence of copy:
 * what's new and where a post goes — the part the button can't say.
 */
export function PostNewsButton({ teamName, onPost }: Props) {
  // PROTOTYPE: the callout opens on every page load and is never persisted
  // as dismissed — reviewers should meet it each time. In production dismissal
  // would be a member preference, the way `showForumBanner` is, so a member
  // sees it once.
  const [tipOpen, setTipOpen] = useState(true);
  const dismiss = () => setTipOpen(false);

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root open={tipOpen}>
        {/* The trigger is a span around the Button, not the Button itself via
            asChild: Radix's Slot merges the `style` prop as an object, and this
            Button's `style` is a string ("border") — merged, it comes out as
            character-indexed garbage and the button loses its variant. */}
        <TooltipPrimitive.Trigger asChild>
          <span className={local.postTrigger}>
            <Button
              size="xs"
              style="link"
              className={local.postAction}
              onClick={() => {
                dismiss();
                onPost();
              }}
            >
              <PlusIcon width={14} height={14} aria-hidden="true" />
              Post news
            </Button>
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="bottom"
            align="end"
            sideOffset={8}
            // Radix Tooltip re-renders its children into a visually-hidden
            // role="tooltip" node for screen readers, which would put a second
            // "Got it" in the tree; an aria-label replaces that copy with text.
            aria-label={`New: post news as ${teamName}. It reaches your followers and the network feed.`}
            className={clsx(tip.tp, tip['tp--highlight'], local.postTip)}
            onEscapeKeyDown={dismiss}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <p className={local.postTipText}>
              <strong>New:</strong> post news as {teamName}. It reaches your followers and the network feed.
            </p>
            <button type="button" className={local.postTipDismiss} onClick={dismiss}>
              Got it
            </button>
            <TooltipPrimitive.Arrow className={tip['tp__arrow--highlight']} width={14} height={7} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
