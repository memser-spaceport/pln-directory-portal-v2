import { DealsLandingPage } from '@/components/page/deals-landing';

export const metadata = {
  title: 'Deals Landing | Protocol Labs',
  description: 'Offer exclusive deals to the Protocol Labs Network. Reach high-quality founders building across Web3, AI, and deep tech.',
};

export default function DealsLandingRoute() {
  return (
    <main>
      <DealsLandingPage />
    </main>
  );
}
