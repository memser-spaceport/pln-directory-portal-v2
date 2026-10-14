import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ActivityTable from '@/components/page/aligement-assets/activities/sections/activity-table';
import { activitiesData } from '@/components/page/aligement-assets/activities/data';
import type { Activity } from '@/components/page/aligement-assets/activities/types';

jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));
jest.mock('@/components/core/plaa-bot/plaa-bot.utils', () => ({ openPlaaBotForActivity: jest.fn() }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onActivitiesFormLinkClicked: jest.fn() }),
}));

const base = activitiesData.activities[0];
const open: Activity = { ...base, id: 'open-one', activity: 'Open activity', audience: undefined };
const infraOnly: Activity = { ...base, id: 'infra-one', activity: 'Infra activity', audience: 'pl-infra-members' };

test('marks infra-only activity cards with a PL Infra only badge', () => {
  render(<ActivityTable activities={[open, infraOnly]} onRowClick={jest.fn()} />);
  const badges = screen.getAllByText('PL Infra only');
  expect(badges.length).toBeGreaterThan(0);
  badges.forEach((badge) => expect(badge.closest('.activity-card')).toHaveTextContent('Infra activity'));
});
