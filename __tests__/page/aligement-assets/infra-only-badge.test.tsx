import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ActivityTable from '@/components/page/aligement-assets/activities/sections/activity-table';
import ActivityDetailModal from '@/components/page/aligement-assets/activities/sections/activity-detail-modal';
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

test('marks infra-only activity cards with the Infra icon badge', () => {
  render(<ActivityTable activities={[open, infraOnly]} onRowClick={jest.fn()} />);
  const badges = screen.getAllByTitle('Only available to PL Infra team members');
  expect(badges.length).toBeGreaterThan(0);
  badges.forEach((badge) => expect(badge.closest('.activity-card')).toHaveTextContent('Infra activity'));
});

test('notes in the modal that an infra-only activity is limited to PL Infra members', () => {
  const { rerender } = render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={infraOnly} />);
  expect(screen.getByText('This activity is only available to PL Infra team members.')).toBeInTheDocument();

  rerender(<ActivityDetailModal isOpen onClose={jest.fn()} activity={open} />);
  expect(screen.queryByText('This activity is only available to PL Infra team members.')).not.toBeInTheDocument();
});

test('keys only the status icons that appear in the list', () => {
  const sunset: Activity = { ...open, id: 'sunset-one', isSunset: true };

  const { rerender } = render(<ActivityTable activities={[open, infraOnly, sunset]} onRowClick={jest.fn()} />);
  expect(screen.getByText('PL Infra only')).toBeInTheDocument();
  expect(screen.getByText('Sunsetting at the end of this snapshot')).toBeInTheDocument();

  // A non-infra member's list has no infra-only activities, so no infra key either.
  rerender(<ActivityTable activities={[open, sunset]} onRowClick={jest.fn()} />);
  expect(screen.queryByText('PL Infra only')).not.toBeInTheDocument();
  expect(screen.getByText('Sunsetting at the end of this snapshot')).toBeInTheDocument();

  rerender(<ActivityTable activities={[open]} onRowClick={jest.fn()} />);
  expect(screen.queryByLabelText('Activity icon key')).not.toBeInTheDocument();
});
