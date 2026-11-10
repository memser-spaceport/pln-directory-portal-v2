import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server.node';

import SnapshotProgressSection from '@/components/page/aligement-assets/rounds/sections/snapshot-progress-section';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onSnapshotTipLinkClicked: jest.fn() }),
}));

const props = {
  startDate: new Date(2026, 10, 1),
  endDate: new Date(2026, 10, 30),
  tipContent: { tipText: 'tip', exploreTitle: 'explore', links: [], bottomLink: { text: 'more', url: '#' } },
};

const progressWidth = (root: ParentNode) => (root.querySelector('[style*="width"]') as HTMLElement).style.width;

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 21, 12));
});

afterEach(() => {
  jest.useRealTimers();
});

test('renders no time-dependent progress on the server, so hydration cannot mismatch', () => {
  const host = document.createElement('div');
  host.innerHTML = renderToString(<SnapshotProgressSection {...props} />);

  expect(progressWidth(host)).toBe('0%');
});

test('shows progress for the current time once mounted in the browser', () => {
  const { container } = render(<SnapshotProgressSection {...props} />);

  expect(parseFloat(progressWidth(container))).toBeGreaterThan(0);
});
