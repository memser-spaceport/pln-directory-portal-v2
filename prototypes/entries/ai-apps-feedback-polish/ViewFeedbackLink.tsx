'use client';

import Link from 'next/link';

// Production stylesheet, verbatim.
import s from '@/components/page/ai-apps/components/ViewFeedbackEntryPoint/ViewFeedbackEntryPoint.module.scss';

interface Props {
  count: number;
}

/**
 * COPY-SIMPLIFY of production `ViewFeedbackEntryPoint`: the masthead link to the
 * feedback page, shown to admins and app creators when there is at least one
 * item. The badge is a total, not an unread count (no read state exists on the
 * backend). It leads to the `ai-apps-feedback` prototype, which mocks that page.
 */
export function ViewFeedbackLink({ count }: Props) {
  if (count === 0) return null;
  return (
    <Link href="/prototypes/ai-apps-feedback" className={s.link}>
      View feedback
      <span className={s.badge}>{count > 99 ? '99+' : count}</span>
    </Link>
  );
}
