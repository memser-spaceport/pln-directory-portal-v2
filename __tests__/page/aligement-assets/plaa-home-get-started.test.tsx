import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import type { PlaaHomeProps } from '@/components/page/aligement-assets/home/home.types';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => false }));

const props: PlaaHomeProps = {
  variant: 'prospect',
  round: {
    roundNumber: 20,
    period: '2026-09-01',
    month: 'September',
    year: 2026,
    onboardedParticipants: 66,
    chart: [],
  },
};

const realLocation = window.location;
const assign = jest.fn();

beforeEach(() => {
  assign.mockReset();
  mockPush.mockReset();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...realLocation, origin: realLocation.origin, assign },
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
});

test('every Get started button does a full page load to an absolute same-origin URL, not a client-side push', () => {
  render(<PlaaHome {...props} />);
  const buttons = screen.getAllByRole('button', { name: /get started/i });
  expect(buttons.length).toBeGreaterThan(0);

  for (const button of buttons) {
    assign.mockReset();
    fireEvent.click(button);

    expect(mockPush).not.toHaveBeenCalled();
    expect(assign).toHaveBeenCalledTimes(1);
    const destination: string = assign.mock.calls[0][0];
    expect(new URL(destination).origin).toBe(realLocation.origin);
  }
});
