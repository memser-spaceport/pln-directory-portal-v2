import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/events',
}));

jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({ onAskHuskyButtonClicked: jest.fn() }),
}));

jest.mock('@/analytics/irl.analytics', () => ({
  useIrlAnalytics: () => ({ trackIrlToHuskyRedirectClicked: jest.fn() }),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackPageClicked: jest.fn() }),
}));

import HuskyBanner from '@/components/page/events/husky-banner';
import IrlHuskyIntegration from '@/components/page/irl/irl-husky/irl-husky-integration';
import HuskyLink from '@/components/core/navbar/husky-link';

const OLD_TEXT = /Husky|AI Chat/;

describe('LAB-2772: entry points into AI Search use the new name', () => {
  it('the events banner reads "Ask AI Search" and links to /ai-search', () => {
    const { container } = render(<HuskyBanner />);

    expect(screen.getByText('Ask AI Search').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('the IRL gatherings card names AI Search and links to /ai-search', () => {
    const { container } = render(<IrlHuskyIntegration currentLocation="" />);

    expect(screen.getByText('AI Search').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(screen.getByText('Open AI Search').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('the navbar button is announced as AI Search', () => {
    render(<HuskyLink />);

    expect(screen.getByRole('button', { name: 'Open AI Search' })).toBeInTheDocument();
  });
});
