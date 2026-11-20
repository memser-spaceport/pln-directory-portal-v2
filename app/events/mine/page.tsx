import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MySubmissionsPage } from '@/components/page/events/my-submissions/MySubmissionsPage';
import { EVENTS_LOCAL_SUBMIT } from '@/utils/events-submit';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { isAdminUser } from '@/utils/user/isAdminUser';

export const metadata: Metadata = {
  title: 'My Submissions | Protocol Labs Directory',
  robots: { index: false, follow: false },
};

/** `/events/mine`: the signed-in member's own events. A signed-out visitor gets the page's sign-in state. */
export default async function Page() {
  if (!EVENTS_LOCAL_SUBMIT) notFound();

  const { userInfo, authToken } = await getCookiesFromHeaders();
  const signedIn = !!userInfo?.uid && !!authToken;

  return <MySubmissionsPage signedIn={signedIn} isAdmin={signedIn && isAdminUser(userInfo)} />;
}
