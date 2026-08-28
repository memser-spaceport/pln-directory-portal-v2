import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockUsePathname = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
}));

const mockUseCurrentSnapshotStatus = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentSnapshotStatus', () => ({
  useCurrentSnapshotStatus: () => mockUseCurrentSnapshotStatus(),
}));

// Bypasses framer-motion/portal machinery, same pattern as team-news-modal.test.tsx.
jest.mock('@/components/common/Modal/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

import { PlaaSnapshotBar } from '@/components/core/navbar/components/PlaaSnapshotBar';

const STATUS = {
  periodLabel: 'August 2026',
  daysLeft: 16,
  progressPct: 52,
  pointsCollected: 420,
  activitiesCount: 7,
  categoriesCount: 4,
  activities: [{ category: 'Programs', title: 'Make a Network Introduction', points: 50 }],
};

describe('PlaaSnapshotBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/alignment-asset/activities');
    mockUseCurrentSnapshotStatus.mockReturnValue(STATUS);
  });

  it('renders nothing off alignment-asset routes', () => {
    mockUsePathname.mockReturnValue('/members');
    const { container } = render(<PlaaSnapshotBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders for every visitor on PLAA routes — no login required', () => {
    render(<PlaaSnapshotBar />);
    expect(screen.getByText('August 2026 snapshot')).toBeInTheDocument();
    expect(screen.getByText('16 days left to contribute')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
  });

  it('singularizes "day" when exactly one day is left', () => {
    mockUseCurrentSnapshotStatus.mockReturnValue({ ...STATUS, daysLeft: 1, progressPct: 100 });
    render(<PlaaSnapshotBar />);
    expect(screen.getByText('1 day left to contribute')).toBeInTheDocument();
  });

  it('opens the snapshot summary modal on click, closed by default', () => {
    render(<PlaaSnapshotBar />);
    expect(screen.queryByText('August 2026, in review')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /snapshot summary/i }));
    expect(screen.getByText('August 2026, in review')).toBeInTheDocument();
  });
});
