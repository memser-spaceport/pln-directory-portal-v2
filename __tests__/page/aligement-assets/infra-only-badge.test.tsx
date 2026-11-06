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

const cardOf = (title: string) =>
  screen.getByText(title, { selector: '.activity-card__title' }).closest('.activity-card')!;
const keyItems = () =>
  Array.from(screen.queryByLabelText('Activity icon key')?.querySelectorAll('.activities-key__item') ?? []);

test('marks only infra-only activity cards with the infra badge', () => {
  render(<ActivityTable activities={[open, infraOnly]} onRowClick={jest.fn()} />);
  expect(cardOf('Infra activity').querySelector('.activity-card__infra-badge')).not.toBeNull();
  expect(cardOf('Open activity').querySelector('.activity-card__infra-badge')).toBeNull();
});

test('adds the infra note to the modal only for infra-only activities', () => {
  const { rerender } = render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={infraOnly} />);
  expect(document.querySelector('.activity-modal__infra-note')).not.toBeNull();

  rerender(<ActivityDetailModal isOpen onClose={jest.fn()} activity={open} />);
  expect(document.querySelector('.activity-modal__infra-note')).toBeNull();
});

test('keys only the status icons that appear in the list', () => {
  const sunset: Activity = { ...open, id: 'sunset-one', isSunset: true };
  const { rerender } = render(<ActivityTable activities={[open, infraOnly, sunset]} onRowClick={jest.fn()} />);
  expect(keyItems().map((item) => item.querySelector('[class*="badge"]')?.className)).toEqual([
    expect.stringContaining('infra'),
    expect.stringContaining('sunset'),
  ]);

  rerender(<ActivityTable activities={[open, sunset]} onRowClick={jest.fn()} />);
  expect(keyItems()).toHaveLength(1);
  expect(keyItems()[0].querySelector('.activity-card__sunset-badge')).not.toBeNull();

  rerender(<ActivityTable activities={[open]} onRowClick={jest.fn()} />);
  expect(screen.queryByLabelText('Activity icon key')).not.toBeInTheDocument();
});
