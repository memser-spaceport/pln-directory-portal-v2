import Link from 'next/link';

import type { DigestPageError } from '@/services/digest/digest.types';

import s from './DigestPage.module.scss';

/** A link that doesn't work: expired, changed, or the API couldn't read it. No stories. */
export function DigestErrorState({ error }: { error: DigestPageError }) {
  const expired = error === 'expired';
  return (
    <div className={s.page}>
      <div className={`${s.email} ${s.state}`} role="alert">
        <h1 className={s.stateTitle}>{expired ? 'This digest link has expired' : 'We couldn’t open this digest'}</h1>
        <p className={s.stateText}>
          {expired
            ? 'Digest links work for 90 days. The latest news from the network is on Home.'
            : 'The link may be incomplete. The latest news from the network is on Home.'}
        </p>
        <Link href="/" className={s.stateLink}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
