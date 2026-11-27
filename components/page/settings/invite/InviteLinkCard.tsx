'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { copyInviteLink } from '@/services/members/invite-link.service';
import type { InviteCopyResult } from '@/types/invite.types';

import s from './InviteSettings.module.scss';

/** How long "Copied" stays on the button. */
export const COPIED_MS = 2000;

/**
 * The live invite link and one copy action (LAB-3398 R3, R9, R10). "Copied" shows in place on the button.
 * If the copy fails, the link stays visible and selected.
 */
export function InviteLinkCard({ inviteUrl }: { inviteUrl: string }) {
  const [state, setState] = useState<'idle' | InviteCopyResult>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => setState('idle'), COPIED_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const onCopy = async () => {
    const result = await copyInviteLink(inviteUrl, globalThis.navigator?.clipboard);
    setState(result);
    if (result === 'fallback') inputRef.current?.select();
  };

  return (
    <>
      <div className={s.linkRow}>
        <input
          ref={inputRef}
          className={s.linkField}
          value={inviteUrl}
          readOnly
          aria-label="Your invite link"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button variant="primary" size="m" className={s.copyButton} onClick={onCopy}>
          {state === 'copied' ? 'Copied' : 'Copy invite link'}
        </Button>
      </div>
      <p className={s.note} role="status" aria-live="polite">
        {state === 'fallback' ? 'The link did not copy. Select the link above and copy it.' : ''}
      </p>
    </>
  );
}
