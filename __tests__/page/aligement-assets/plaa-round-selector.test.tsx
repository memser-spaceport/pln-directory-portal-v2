import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import PlaaRoundSelector from '@/components/page/aligement-assets/plaa-round-selector';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onRoundSelectorOpened: jest.fn(),
    onRoundSelectorPrevClicked: jest.fn(),
    onRoundSelectorNextClicked: jest.fn(),
    onRoundSelectorGoToCurrentClicked: jest.fn(),
  }),
}));

jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));

const roundField = () => screen.getByRole('textbox', { name: 'Round number' });
const openDropdown = () => fireEvent.click(screen.getByRole('button', { name: 'Open round selector dropdown' }));

test('follows the viewed round when the URL moves to another round', () => {
  const { rerender } = render(<PlaaRoundSelector currentRound={10} totalRounds={11} viewingRound={3} />);
  openDropdown();
  expect(roundField()).toHaveValue('3');

  rerender(<PlaaRoundSelector currentRound={10} totalRounds={11} viewingRound={5} />);

  expect(roundField()).toHaveValue('5');
});

test('keeps a round the user stepped to when the viewed round does not change', () => {
  const { rerender } = render(<PlaaRoundSelector currentRound={10} totalRounds={11} viewingRound={3} />);
  openDropdown();
  fireEvent.click(screen.getByRole('button', { name: 'Previous round' }));
  expect(roundField()).toHaveValue('2');

  rerender(<PlaaRoundSelector currentRound={10} totalRounds={11} viewingRound={3} />);

  expect(roundField()).toHaveValue('2');
});
