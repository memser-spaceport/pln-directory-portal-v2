'use client';

import { useEffect, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { PlusIcon } from '@/components/icons';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

import tip from '@/components/core/tooltip/tooltip.module.css';
import local from './PostNewsModal.module.scss';

const tipKey = (memberUid: string) => `team_news_post_tip_dismissed_${memberUid}`;

interface Props {
  teamName: string;
  memberUid: string;
  onPost: () => void;
}

export function PostNewsButton({ teamName, memberUid, onPost }: Props) {
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUiFlag(tipKey(memberUid)).then((dismissed) => {
      if (!cancelled && !dismissed) setTipOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [memberUid]);

  const dismiss = () => {
    setTipOpen(false);
    void setUiFlag(tipKey(memberUid));
  };

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
              <PlusIcon width={12} height={12} aria-hidden="true" />
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
