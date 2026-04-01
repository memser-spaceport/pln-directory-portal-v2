import { AdvisorOnboardingContainer } from '@/components/page/advisor-onboarding/AdvisorOnboardingContainer';
import { Metadata } from 'next';

export default function AdvisorSignUpPage() {
  return <AdvisorOnboardingContainer />;
}

export const metadata: Metadata = {
  title: 'Advisor Sign Up | Protocol Labs Directory',
};
