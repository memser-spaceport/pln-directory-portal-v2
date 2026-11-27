'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';
import { copyInviteLink } from '@/services/members/invite-link.service';

import s from './DigestCopyLink.module.scss';

export const DIGEST_COPIED_MS = 2000;

type Props = {
  /** The link to copy. Without one the slot shows nothing. */
  url: string | null | undefined;
};

/**
 * "Copy link" beside the digest dateline (LAB-3398, Polina's design). The button shows "Copied" for 2 s. If the browser
 * has no clipboard or blocks the write, the link shows in a selected read-only field, so the reader copies it by hand.
 * It sends no events.
 */
export function DigestCopyLink({ url }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (state === 'fallback') field.current?.select();
  }, [state]);

  if (!url) return null;

  const copy = async () => {
    clearTimeout(timer.current);
    if ((await copyInviteLink(url, navigator.clipboard)) === 'fallback') return setState('fallback');
    setState('copied');
    timer.current = setTimeout(() => setState('idle'), DIGEST_COPIED_MS);
  };

  return (
    <span className={s.root}>
      <Button type="button" style="border" variant="neutral" size="xs" className={s.button} onClick={copy}>
        {state === 'copied' ? (
          <CheckIcon width={14} height={14} />
        ) : (
          <img src="/icons/link-gray.svg" width={14} height={14} alt="" />
        )}
        {state === 'copied' ? 'Copied' : 'Copy link'}
      </Button>
      <span role="status" className={state === 'fallback' ? s.fallback : s.hidden}>
        {state === 'copied' && 'Link copied'}
        {state === 'fallback' && 'The link did not copy. Select the link and copy it.'}
      </span>
      {state === 'fallback' && (
        <input
          ref={field}
          className={s.field}
          readOnly
          value={url}
          aria-label="Link to copy"
          onFocus={(e) => e.target.select()}
        />
      )}
    </span>
  );
}
