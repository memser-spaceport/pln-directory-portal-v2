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
    expect(record.id).not.toBe('build-ai-app');
    expect(card).toHaveTextContent(record.category);
    expect(card.querySelector('.ph-teaser__pts')).toHaveTextContent(`${record.points} pts`);
    if (record.verificationType) expect(card).toHaveTextContent(modeLabels[record.verificationType]);
    fireEvent.click(card);
    expect(mockPush).toHaveBeenLastCalledWith(`/alignment-asset/activities#${record.id}`);
  }
});

test('filters sunset and legacy AI entries before filling the three suggestion slots', () => {
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

test.each<[Partial<Activity>, boolean]>([
  [{ audience: undefined }, false],
  [{ audience: 'pl-infra-members' }, false],
  [{ cta: 'confirm' }, false],
  [{ isSunset: true }, false],
  [{ id: 'build-ai-app' }, false],
  [{}, true],
])(
  'AI-app suggestions fail closed unless the current destination is public and submission-based: %j',
  (overrides, visible) => {
    const replacement: Activity = {
      ...source[0],
      id: 'build-ai-app-submission',
      activity: 'Build an AI App',
      points: '775',
      category: 'Network Tooling',
      verificationType: 'Submission',
      cta: 'submit',
      audience: 'all-plaa-participants',
      popupContent: { title: 'Build an AI App', rules: ['Open to all PLAA participants.'] },
      ...overrides,
    };
    jest.replaceProperty(activitiesData, 'activities', [replacement]);
    const { container } = render(<PlaaHome {...props} />);
    expect(cards(container)).toHaveLength(visible ? 1 : 0);
    if (visible) {
      expect(cards(container)[0]).toHaveTextContent('775 pts');
      expect(cards(container)[0]).toHaveTextContent('Submission');
      fireEvent.click(cards(container)[0]);
      expect(mockPush).toHaveBeenLastCalledWith('/alignment-asset/activities#build-ai-app-submission');
    }
  },
);
