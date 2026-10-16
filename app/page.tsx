import { permanentRedirect } from 'next/navigation';
import { PAGE_ROUTES } from '@/utils/constants';
import { listingPageMetadata } from '@/utils/seo';

/* Permanent (308), LAB-2887: a temporary redirect tells Google that `/` stays the canonical address, so the
   site root's signals never moved to /home. */
async function LandingPage() {
  permanentRedirect(PAGE_ROUTES.HOME);
}

export default LandingPage;

export const metadata = listingPageMetadata({
  title: 'Home | Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
  path: PAGE_ROUTES.HOME,
});
