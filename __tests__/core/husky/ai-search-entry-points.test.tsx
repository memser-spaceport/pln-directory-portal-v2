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
  it('the events banner reads "Ask AI agent chat" and links to /ai-search', () => {
    const { container } = render(<HuskyBanner />);

    expect(screen.getByText('Ask AI agent chat').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('the IRL gatherings card names AI agent chat and links to /ai-search', () => {
    const { container } = render(<IrlHuskyIntegration currentLocation="" />);

    expect(screen.getByText('AI agent chat').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(screen.getByText('Open AI agent chat').closest('a')).toHaveAttribute('href', '/ai-search');
    expect(container.textContent).not.toMatch(OLD_TEXT);
  });

  it('the navbar button is announced as AI agent chat', () => {
    render(<HuskyLink />);

    expect(screen.getByRole('button', { name: 'Open AI agent chat' })).toBeInTheDocument();
  });
});
