import { DemoDayListPage } from '@/components/page/demo-day/DemoDayListPage';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMemberInfo } from '@/app/actions/demo-day.actions';
import type { Metadata } from 'next';
import { DEMO_DAY_PATH } from '@/utils/constants';
import { absoluteUrl } from '@/utils/seo';

export default async function Page() {
  const { userInfo, authToken, isLoggedIn } = await getCookiesFromHeaders();

  let memberData = null;
  if (isLoggedIn && userInfo?.uid) {
    const memberResponse = await getMemberInfo(userInfo.uid, authToken);
    if (!memberResponse.isError) {
      memberData = memberResponse;
    }
  }

  return <DemoDayListPage isLoggedIn={isLoggedIn} userInfo={userInfo} memberData={memberData?.data} />;
}

/* The landing page's own canonical address (LAB-2923). Here, not in the Demo Day layout: the layout's metadata also
   reaches every nested Demo Day page, which must not all claim to be this one. Only `alternates` is set, so the
   layout's Open Graph and Twitter fields still apply (metadata merges per top-level key). */
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl(DEMO_DAY_PATH) },
};
