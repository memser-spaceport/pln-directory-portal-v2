import Link from 'next/link';

import type { DigestPageError } from '@/services/digest/digest.types';

import s from './DigestEmailSettings.module.scss';

const TEXT: Record<DigestPageError, { title: string; text: string }> = {
  expired: {
    title: 'This link has expired',
    text: 'Links in the digest email work for 90 days. Sign in to manage your email.',
  },
  invalid: {
    title: 'We couldn’t open your email settings',
    text: 'The link may be incomplete. Sign in to manage your email.',
  },
  unavailable: {
    title: 'We couldn’t open your email settings',
    text: 'Please try again in a few minutes, or sign in to manage your email.',
  },
};

/** `/digest/email` with a link that doesn't work (LAB-3312): no settings, and the way to them after sign-in. */
export function DigestEmailErrorState({ error }: { error: DigestPageError }) {
  return (
    <div className={s.page}>
      <main className={s.card} role="alert">
        <h1 className={s.stateTitle}>{TEXT[error].title}</h1>
        <p className={s.stateText}>{TEXT[error].text}</p>
        <Link href="/settings/email" className={s.stateLink}>
          Email preferences
        </Link>
      </main>
    </div>
  );
}
