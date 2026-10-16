import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import { activitiesData } from '@/components/page/aligement-assets/activities/data';
import type { Activity } from '@/components/page/aligement-assets/activities/types';
import type { PlaaHomeProps } from '@/components/page/aligement-assets/home/home.types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
const mockUseIsInfraMember = jest.fn(() => false);
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => mockUseIsInfraMember() }));

const props: PlaaHomeProps = {
  variant: 'member',
  round: {
    roundNumber: 20,
    period: '2026-09-01',
    month: 'September',
    year: 2026,
    onboardedParticipants: 66,
    chart: [],
  },
};
const source = activitiesData.activities;
const cards = (container: HTMLElement) => [...container.querySelectorAll<HTMLButtonElement>('.ph-teaser')];
const modeLabels = { Auto: 'Auto-tracked', Submission: 'Submission', 'Manual Review': 'Manual Review' };

afterEach(() => {
  jest.restoreAllMocks();
  mockPush.mockReset();
});

test('suggestions use the same current records as the production Activities page', () => {
  const { container } = render(<PlaaHome {...props} />);
  expect(cards(container)).toHaveLength(3);
  for (const card of cards(container)) {
    const record = source.find(
      (activity) => activity.activity === card.querySelector('.ph-teaser__title')?.textContent,
    )!;
    expect(record).toBeDefined();
    expect(record.isSunset).not.toBe(true);
    expect(record.audience).toBeUndefined();
    expect(card).toHaveTextContent(record.category);
    expect(card.querySelector('.ph-teaser__pts')).toHaveTextContent(`${record.points} pts`);
    if (record.verificationType) expect(card).toHaveTextContent(modeLabels[record.verificationType]);
    fireEvent.click(card);
    expect(mockPush).toHaveBeenLastCalledWith(`/alignment-asset/activities#${record.id}`);
  }
});

test('filters sunset and restricted entries before filling the three suggestion slots', () => {
  const legacy = source.find((activity) => activity.id === 'build-ai-app')!;
  jest.replaceProperty(activitiesData, 'activities', [
    { ...source[0], id: 'sunset-high-score', points: '99999', isSunset: true },
    { ...legacy, isSunset: false },
    ...source.slice(0, 3),
  ]);
  const { container } = render(<PlaaHome {...props} />);
  expect(cards(container)).toHaveLength(3);
  expect(
    cards(container)
      .map((card) => card.querySelector('.ph-teaser__title')?.textContent)
      .sort(),
  ).toEqual(
    source
      .slice(0, 3)
      .map((activity) => activity.activity)
      .sort(),
  );
});

test('points, category, review label and destination follow changes to the source record', () => {
  const record: Activity = {
    ...source[0],
    id: 'current-record',
    points: '1375',
    category: 'Current category',
    verificationType: 'Submission',
  };
  jest.replaceProperty(activitiesData, 'activities', [record]);
  const { container, rerender } = render(<PlaaHome {...props} />);
  expect(cards(container)[0]).toHaveTextContent('1375 pts');
  expect(cards(container)[0]).toHaveTextContent('Current category');
  expect(cards(container)[0]).toHaveTextContent('Submission');
  jest.replaceProperty(activitiesData, 'activities', [
    { ...record, points: '425', category: 'Updated category', verificationType: 'Manual Review' },
  ]);
  rerender(<PlaaHome {...props} />);
  expect(cards(container)[0]).toHaveTextContent('425 pts');
  expect(cards(container)[0]).toHaveTextContent('Updated category');
  expect(cards(container)[0]).toHaveTextContent('Manual Review');
  fireEvent.click(cards(container)[0]);
  expect(mockPush).toHaveBeenLastCalledWith('/alignment-asset/activities#current-record');
});

test.each<[Partial<Activity>, boolean, boolean]>([
  [{ isSunset: true }, false, false],
  [{ isSunset: true }, true, false],
  [{ audience: 'pl-infra-members' }, false, false],
  [{ audience: 'pl-infra-members' }, true, true],
  [{ audience: 'pl-infra-members', isSunset: true }, true, false],
  [{}, false, true],
])('suggests %j to an infra member=%s: %s', (overrides, isInfraMember, visible) => {
  mockUseIsInfraMember.mockReturnValue(isInfraMember);
  jest.replaceProperty(activitiesData, 'activities', [{ ...source[0], id: 'candidate', ...overrides }]);
  const { container } = render(<PlaaHome {...props} />);
  expect(cards(container)).toHaveLength(visible ? 1 : 0);
});
