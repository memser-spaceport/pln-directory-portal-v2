'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { unsubscribeSuggestedCandidatesEmail } from '@/services/jobs/suggested-candidates-unsubscribe.service';
import s from '@/components/page/jobs/JobUnsubscribeClient/JobUnsubscribeClient.module.scss';

type Phase = 'pending' | 'success' | 'invalid' | 'failed';

const ERROR_MESSAGES: Record<'invalid' | 'failed', string> = {
  invalid: 'This unsubscribe link is invalid or has expired. You can turn the email off in Email Preferences.',
  failed: 'Something went wrong on our side. Please try again later, or turn the email off in Email Preferences.',
};

/**
 * Landing page for the unsubscribe link in the suggested candidates email
 * (`/settings/email/unsubscribed?token=…`). Works signed out: the token is the
 * credential. Same layout as the job alerts unsubscribe page.
 */
export function SuggestedCandidatesUnsubscribe() {
  const token = useSearchParams().get('token');
  const [phase, setPhase] = useState<Phase>('pending');
  // Strict mode runs effects twice in dev; the POST goes out once per token.
  // No cleanup cancels the result: the second run must not drop the first's answer.
  const requestedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || requestedTokenRef.current === token) {
      return;
    }
    requestedTokenRef.current = token;

    unsubscribeSuggestedCandidatesEmail(token).then((result) => {
      setPhase(result.ok ? 'success' : result.reason);
    });
  }, [token]);

  const emailPreferencesLink = (
    <div className={s.actions}>
      <Link href="/settings/email" className={s.primary}>
        Email Preferences
      </Link>
    </div>
  );

  if (!token || phase === 'invalid' || phase === 'failed') {
    return (
      <div className={s.wrapper}>
        <h1 className={`${s.title} ${s.error}`}>Couldn&apos;t unsubscribe.</h1>
        <p className={s.subtitle}>{ERROR_MESSAGES[phase === 'failed' ? 'failed' : 'invalid']}</p>
        {emailPreferencesLink}
      </div>
    );
  }

  if (phase === 'pending') {
    return (
      <div className={s.wrapper}>
        <p className={s.title}>Processing your request…</p>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <h1 className={s.title}>Unsubscribed.</h1>
      <p className={s.subtitle}>You won&apos;t get suggested candidates emails anymore.</p>
      {emailPreferencesLink}
    </div>
  );
}
