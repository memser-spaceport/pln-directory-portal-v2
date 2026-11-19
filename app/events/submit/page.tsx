import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SubmitEventPage } from '@/components/page/events/event-submit/SubmitEventPage';
import { EVENTS_LOCAL_SUBMIT } from '@/utils/events-submit';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

/** The submit form, open to signed-in members and signed-out visitors. Not found while the rollout flag is off. */
export default async function Page() {
  if (!EVENTS_LOCAL_SUBMIT) notFound();
  const { userInfo, authToken } = await getCookiesFromHeaders();
  return <SubmitEventPage signedIn={!!userInfo?.uid && !!authToken} />;
}

export const metadata: Metadata = {
  title: 'Submit Event | Protocol Labs Directory',
  description: 'Submit an event to the Protocol Labs network events page.',
};
