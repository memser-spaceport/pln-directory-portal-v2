'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import {
  useIntroRequestAnalytics,
  type IntroRequestEntryPoint,
  type IntroRequestEventContext,
} from '@/analytics/intro-requests.analytics';
import { Button } from '@/components/common/Button';
import { useCanRequestIntro } from '@/services/intro-requests/hooks/useCanRequestIntro';
import type { IntroRequestTargetType } from '@/services/intro-requests/intro-requests.service';

import { RequestIntroDialog } from './RequestIntroDialog';

import s from './RequestIntroEntry.module.scss';

interface Props {
  type: IntroRequestTargetType;
  targetId: string;
  targetName: string;
  className?: string;
  /** Where the control sits. Defaults to the member or team page header. */
  entryPoint?: IntroRequestEntryPoint;
}

export function RequestIntroEntry({ type, targetId, targetName, className, entryPoint }: Props) {
  const canRequest = useCanRequestIntro();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { onButtonShown, onDialogOpened } = useIntroRequestAnalytics();
  const shownForRef = useRef<string | null>(null);
  const visible = Boolean(canRequest && targetId && targetName);
  const resolvedEntryPoint: IntroRequestEntryPoint =
    entryPoint ?? (type === 'MEMBER' ? 'member-header' : 'team-header');
  const context: IntroRequestEventContext = {
    targetType: type === 'MEMBER' ? 'member' : 'team',
    entryPoint: resolvedEntryPoint,
    source: 'modal',
  };
  const { targetType } = context;

  // Once a page view: one event for each target this control shows for.
  useEffect(() => {
    if (!visible) return;
    const key = `${resolvedEntryPoint}:${targetId}`;
    if (shownForRef.current === key) return;
    shownForRef.current = key;
    onButtonShown({ targetType, entryPoint: resolvedEntryPoint, source: 'modal' });
  }, [visible, targetId, targetType, resolvedEntryPoint, onButtonShown]);

  if (!visible) {
    return null;
  }

  const openDialog = () => {
    onDialogOpened(context);
    setOpen(true);
  };

  return (
    <>
      {sent ? (
        <span className={clsx(s.sentSlot, className)}>
          <span className={s.sizer} aria-hidden="true">
            <EnvelopeIcon />
            Request an intro
          </span>
          <span className={s.sent}>
            <span aria-hidden="true">✓</span>
            Intro requested
          </span>
        </span>
      ) : (
        <Button style="fill" variant="primary" size="xs" className={clsx(s.button, className)} onClick={openDialog}>
          <EnvelopeIcon />
          Request an intro
        </Button>
      )}
      {open && (
        <RequestIntroDialog
          type={type}
          targetId={targetId}
          targetName={targetName}
          entryPoint={resolvedEntryPoint}
          onSent={() => setSent(true)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.25 4.25 8 8.75l5.75-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
