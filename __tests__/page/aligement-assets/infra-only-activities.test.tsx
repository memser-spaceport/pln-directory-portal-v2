import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ActivitiesComponent from '@/components/page/aligement-assets/activities/activities-component';
import { activitiesData, canSeeActivity, isOpenActivity } from '@/components/page/aligement-assets/activities/data';
import type { Activity } from '@/components/page/aligement-assets/activities/types';

const mockUseIsInfraMember = jest.fn(() => false);
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => mockUseIsInfraMember() }));

let mockHash = '';
let mockSearch = '';
jest.mock('@/hooks/useHash', () => ({ __esModule: true, default: () => mockHash }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/hooks/useScrollDepthTracking', () => ({ useScrollDepthTracking: jest.fn() }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onActivitiesRowClicked: jest.fn(),
    onActivitiesModalClosed: jest.fn(),
    onActivitiesFormLinkClicked: jest.fn(),
    onActivitiesModalLinkClicked: jest.fn(),
  }),
}));
jest.mock('@/components/page/aligement-assets/activities/sections/hero-section', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/page/aligement-assets/rounds/sections/support-section', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/page/aligement-assets/activities/sections/activity-table', () => ({
  __esModule: true,
  default: ({ activities }: { activities: Activity[] }) => (
    <ul>
      {activities.map((activity) => (
        <li key={activity.id}>{activity.activity}</li>
      ))}
    </ul>
  ),
}));
jest.mock('@/components/page/aligement-assets/activities/sections/activity-detail-modal', () => ({
  __esModule: true,
  default: ({ isOpen, activity }: { isOpen: boolean; activity: Activity | null }) =>
    isOpen && activity ? <div role="dialog">{activity.activity}</div> : null,
}));

const base = activitiesData.activities[0];
const open: Activity = { ...base, id: 'open-one', category: 'Programs', activity: 'Open activity' };
const infraOnly: Activity = {
  ...base,
  id: 'infra-one',
  category: 'Programs',
  activity: 'Infra activity',
  isSunset: false,
  audience: 'pl-infra-members',
};

beforeEach(() => {
  mockHash = '';
  mockSearch = '';
  jest.replaceProperty(activitiesData, 'activities', [open, infraOnly]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('activity visibility helpers', () => {
  test.each<[Partial<Activity>, boolean, boolean]>([
    [{}, false, true],
    [{ audience: 'pl-infra-members' }, false, false],
    [{ audience: 'pl-infra-members' }, true, true],
  ])('canSeeActivity(%j, infra=%s) is %s', (overrides, isInfraMember, expected) => {
    expect(canSeeActivity({ ...base, audience: undefined, ...overrides }, isInfraMember)).toBe(expected);
  });

  test('isOpenActivity defaults to a non-infra viewer and still drops sunset activities', () => {
    expect(isOpenActivity(infraOnly)).toBe(false);
    expect(isOpenActivity(infraOnly, true)).toBe(true);
    expect(isOpenActivity({ ...infraOnly, isSunset: true }, true)).toBe(false);
  });
});

describe('Activities page', () => {
  test('hides infra-only activities from non-infra members', () => {
    mockUseIsInfraMember.mockReturnValue(false);
    render(<ActivitiesComponent />);
    expect(screen.getByText('Open activity')).toBeInTheDocument();
    expect(screen.queryByText('Infra activity')).not.toBeInTheDocument();
  });

  test('shows infra-only activities to infra members', () => {
    mockUseIsInfraMember.mockReturnValue(true);
    render(<ActivitiesComponent />);
    expect(screen.getByText('Open activity')).toBeInTheDocument();
    expect(screen.getByText('Infra activity')).toBeInTheDocument();
  });

  test('keeps infra-only activities out of a category filter for non-infra members', () => {
    mockUseIsInfraMember.mockReturnValue(false);
    mockSearch = 'category=Programs';
    render(<ActivitiesComponent />);
    expect(screen.queryByText('Infra activity')).not.toBeInTheDocument();
  });

  test('does not open an infra-only activity from a deep link for non-infra members', () => {
    mockUseIsInfraMember.mockReturnValue(false);
    mockHash = '#infra-one';
    render(<ActivitiesComponent />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens an infra-only activity from a deep link for infra members', () => {
    mockUseIsInfraMember.mockReturnValue(true);
    mockHash = '#infra-one';
    render(<ActivitiesComponent />);
    expect(screen.getByRole('dialog')).toHaveTextContent('Infra activity');
  });
});
