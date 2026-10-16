import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ActivityDetailModal from '@/components/page/aligement-assets/activities/sections/activity-detail-modal';
import { activitiesData } from '@/components/page/aligement-assets/activities/data';

jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('@/components/core/plaa-bot/plaa-bot.utils', () => ({ openPlaaBotForActivity: jest.fn() }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onActivitiesModalLinkClicked: jest.fn(),
    onActivitiesFormLinkClicked: jest.fn(),
  }),
}));

const productTesting = activitiesData.activities.find((a) => a.id === 'provide-product-testing-feedback')!;

describe('Product testing activity: Max request', () => {
  beforeEach(() => {
    render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={productTesting} />);
  });

  it('links Max in bold to the Max app', () => {
    const max = screen.getByRole('link', { name: 'Max' });
    expect(max).toHaveAttribute('href', 'https://os.pl.xyz/pl-infra/ai-apps/cmunhqj0l00hgsd4fl7e86h4g');
    expect(max.querySelector('strong')).toHaveTextContent('Max');
  });

  it('links the survey', () => {
    expect(screen.getByRole('link', { name: 'Max First Impressions Survey' })).toHaveAttribute(
      'href',
      'https://claude.ai/artifact/U11kcPTw19MN3ruXrgdHjB?sk=HkBoSTEdQyiG9wCWD_487g',
    );
  });

  it('shows the copy as written, without markdown characters', () => {
    const paragraph = screen.getByText(/Get set up on Max/).closest('p')!;
    expect(paragraph).toHaveTextContent(
      'Max — Get set up on Max, explore your initial Radar results, and complete the Max First Impressions Survey to share feedback on ease of use and the relevance of the outputs. Collect 100 points for completing the test and survey. Feedback is eligible through Saturday, October 31, 2026.',
    );
    expect(paragraph.textContent).not.toMatch(/\*\*|\]\(/);
  });

  it('keeps the existing Factorio request and its link, in bold like Max', () => {
    const factorio = screen.getByRole('link', { name: 'Factorio Weekly Updates' });
    expect(factorio).toHaveAttribute('href', '/pl-infra/ai-apps/cmst544z7008siz4g1d59fubr/weekly');
    expect(factorio.closest('strong')).not.toBeNull();
  });
});

describe('Profile activity: restarted requirements', () => {
  const profile = activitiesData.activities.find((a) => a.id === 'update-directory-profile')!;

  beforeEach(() => {
    render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={profile} />);
  });

  it('keeps 250 auto-verified points under the new name', () => {
    expect(profile.activity).toBe('Update Your PL Directory Profile');
    expect(profile.points).toBe('250');
    expect(profile.verificationType).toBe('Auto');
    expect(screen.getByText(/everyone can collect points for it/)).toBeInTheDocument();
  });

  it('bolds the profile labels in the rules without showing markdown', () => {
    const optIn = screen.getByText('Show contact details to PL network members');
    expect(optIn.tagName).toBe('STRONG');
    expect(screen.getByText('Your CV', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('GitHub', { selector: 'strong' })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('**');
  });
});
