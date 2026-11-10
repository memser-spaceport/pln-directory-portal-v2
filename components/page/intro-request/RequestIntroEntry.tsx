'use client';

import { useState } from 'react';
import clsx from 'clsx';

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
}

export function RequestIntroEntry({ type, targetId, targetName, className }: Props) {
  const canRequest = useCanRequestIntro();
  const [open, setOpen] = useState(false);

  if (!canRequest || !targetId || !targetName) return null;

  return (
    <>
      <Button
        style="fill"
        variant="primary"
        size="xs"
        className={clsx(s.button, className)}
        onClick={() => setOpen(true)}
      >
        <EnvelopeIcon />
        Request an intro
      </Button>
      {open && (
        <RequestIntroDialog type={type} targetId={targetId} targetName={targetName} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.25 4.1 8 8.15 13.75 4.1" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
