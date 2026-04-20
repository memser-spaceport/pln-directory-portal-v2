import { AdvisorsPrototypePage } from '@/components/page/advisors-prototype/AdvisorsPrototypePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advisors MVP Prototype · LabOS',
};

export default function Page() {
  return <AdvisorsPrototypePage />;
}
