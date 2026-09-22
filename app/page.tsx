import { redirect } from 'next/navigation';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';

async function LandingPage() {
  redirect(PAGE_ROUTES.HOME);
}

export default LandingPage;

export const metadata = listingPageMetadata({
  title: 'Home | Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
  path: PAGE_ROUTES.HOME,
});
