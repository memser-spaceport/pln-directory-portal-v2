'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { PlusIcon } from '@/components/icons';
import { useOneTimeCallout } from '@/hooks/useOneTimeCallout';

import tip from '@/components/core/tooltip/tooltip.module.css';
import local from './PostNewsModal.module.scss';

/* This used to take the poster's uid as a prop and build its own storage key
   from it. The hook reads the uid from the session instead, so the prop is
   gone: both callers happened to pass the signed-in member, but `AuthGuard`
   lets a directory admin write another member's row, and a future caller
   passing a profile uid would have recorded the dismissal against the wrong
   account with nothing to catch it. */
const TIP_KEY = 'team_news_post_tip';

interface Props {
  teamName: string;
  onPost: () => void;
}

export function PostNewsButton({ teamName, onPost }: Props) {
  const { open: tipOpen, dismiss } = useOneTimeCallout(TIP_KEY);

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root open={tipOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span className={local.postTrigger}>
            <Button
              size="xxs"
              style="fill"
              variant="primary"
              className={local.postAction}
              onClick={() => {
                dismiss();
                onPost();
              }}
            >
              {/* Rendered at its native 16x16 viewBox — scaling this icon's thin
                  circular ring down to 12px left it blurry from sub-pixel
                  anti-aliasing. */}
              <PlusIcon width={16} height={16} aria-hidden="true" />
              Post news
            </Button>
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="bottom"
            align="end"
            sideOffset={8}
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
