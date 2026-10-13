import { SuggestedCandidatesUnsubscribe } from '@/components/page/email-preferences/components/SuggestedCandidatesUnsubscribe';

export const dynamic = 'force-dynamic';

/**
 * The suggested candidates email's unsubscribe link lands here. Public on
 * purpose: `/settings/*` is not gated by proxy.ts, and unlike its parent
 * `/settings/email` this page does not redirect signed-out visitors.
 */
export default function SuggestedCandidatesUnsubscribedPage() {
  return <SuggestedCandidatesUnsubscribe />;
}
