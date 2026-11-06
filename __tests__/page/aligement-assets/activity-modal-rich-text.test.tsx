import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ActivityDetailModal from '@/components/page/aligement-assets/activities/sections/activity-detail-modal';
import { activitiesData } from '@/components/page/aligement-assets/activities/data';
import type { Activity } from '@/components/page/aligement-assets/activities/types';

jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('@/components/core/plaa-bot/plaa-bot.utils', () => ({ openPlaaBotForActivity: jest.fn() }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onActivitiesModalLinkClicked: jest.fn(),
    onActivitiesFormLinkClicked: jest.fn(),
  }),
}));

const base = activitiesData.activities[0];
const activity: Activity = {
  ...base,
  popupContent: {
    title: 'Fixture activity',
    overview:
      'Try [**Tool**](https://example.com/tool) and fill in the [survey](/survey).\n\nThen **report back** to the team.',
    networkBenefits: 'Plain text stays plain.',
    rules: ['Turn on **Show contact details** in your profile', 'Read [the guide](https://example.com/guide)'],
  },
};

beforeEach(() => {
  render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={activity} />);
});

describe('Activity modal inline markdown', () => {
  it('turns [label](url) into a link that opens in a new tab', () => {
    const survey = screen.getByRole('link', { name: 'survey' });
    expect(survey).toHaveAttribute('href', '/survey');
    expect(survey).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'the guide' })).toHaveAttribute('href', 'https://example.com/guide');
  });

  it('bolds a link label written as [**label**](url)', () => {
    const tool = screen.getByRole('link', { name: 'Tool' });
    expect(tool).toHaveAttribute('href', 'https://example.com/tool');
    expect(tool.querySelector('strong')).toHaveTextContent('Tool');
  });

  it('bolds **text** in paragraphs and rules', () => {
    expect(screen.getByText('report back', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Show contact details', { selector: 'strong' })).toBeInTheDocument();
  });

  it('never shows the markdown characters', () => {
    expect(document.body.textContent).not.toMatch(/\*\*|\]\(/);
  });
});
