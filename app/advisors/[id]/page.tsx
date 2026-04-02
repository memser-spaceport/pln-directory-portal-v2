import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { redirect } from 'next/navigation';
import { ADVISOR_WHITELISTED_FOUNDERS } from '@/config/advisors';
import { AdvisorProfile } from '@/components/page/advisors/AdvisorProfile';
import { PAGE_ROUTES } from '@/utils/constants';

export default async function AdvisorDetailPage({ params }: { params: { id: string } }) {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  // TODO: restrict to whitelist before production
  if (!isLoggedIn || !userInfo) {
    redirect(PAGE_ROUTES.HOME);
  }

  return <AdvisorProfile advisorId={params.id} />;
}

export const metadata = {
  title: 'Advisor | Protocol Labs Directory',
};
