import { DemoDayListPage } from '@/components/page/demo-day/DemoDayListPage';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMemberInfo } from '@/app/actions/demo-day.actions';
import type { Metadata } from 'next';
import { DEMO_DAY_PATH, getDemoDayMetadata } from '@/utils/constants';
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

/* The landing page's own canonical address, title and description (LAB-2923): it names the searches it should be
   found for, "venture investors" and "VC". Here, not in the Demo Day layout: the layout's metadata also reaches every
   nested Demo Day page, which must neither claim this address nor take this copy. Open Graph and Twitter are set in
   full, because metadata merges per top-level key: the layout's image is repeated, not inherited. */
const DEMO_DAY_LANDING_TITLE = 'Protocol Labs Demo Day: startups for venture investors and VCs';
const DEMO_DAY_LANDING_DESCRIPTION =
  'Protocol Labs Demo Days showcase top, pre-selected startups from the PL network to venture investors, VCs and qualifying angels. Review pitches asynchronously and connect or invest in one click.';
const { imageUrl: demoDayImageUrl } = getDemoDayMetadata();

export const metadata: Metadata = {
  title: DEMO_DAY_LANDING_TITLE,
  description: DEMO_DAY_LANDING_DESCRIPTION,
  alternates: { canonical: absoluteUrl(DEMO_DAY_PATH) },
  openGraph: {
    type: 'website',
    url: absoluteUrl(DEMO_DAY_PATH),
    title: DEMO_DAY_LANDING_TITLE,
    description: DEMO_DAY_LANDING_DESCRIPTION,
    images: [{ url: demoDayImageUrl, alt: 'Demo Day', type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEMO_DAY_LANDING_TITLE,
    description: DEMO_DAY_LANDING_DESCRIPTION,
    images: [{ url: demoDayImageUrl, alt: 'Demo Day', type: 'image/png' }],
  },
};
