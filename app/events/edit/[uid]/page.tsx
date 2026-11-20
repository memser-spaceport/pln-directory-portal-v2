import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EditEventPage } from '@/components/page/events/event-edit/EditEventPage';
import { EVENTS_LOCAL_SUBMIT } from '@/utils/events-submit';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { isAdminUser } from '@/utils/user/isAdminUser';

/** One event's edit page, for its submitter and a directory admin. Not found while the rollout flag is off. */
export default async function Page({ params }: { params: Promise<{ uid: string }> }) {
  if (!EVENTS_LOCAL_SUBMIT) notFound();
  const { uid } = await params;
  const { userInfo, authToken } = await getCookiesFromHeaders();
  return <EditEventPage eventUid={uid} signedIn={!!userInfo?.uid && !!authToken} isAdmin={isAdminUser(userInfo)} />;
}

export const metadata: Metadata = {
  title: 'Edit Event | Protocol Labs Directory',
  robots: { index: false, follow: false },
};
