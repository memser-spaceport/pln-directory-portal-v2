import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
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

import { PlaaSnapshotSummaryModal } from '@/components/core/navbar/components/PlaaSnapshotBar/PlaaSnapshotSummaryModal';

const STATUS = {
  periodLabel: 'August 2026',
  daysLeft: 16,
  progressPct: 52,
  pointsCollected: 420,
  activitiesCount: 7,
  categoriesCount: 4,
  activities: [
    { category: 'Programs', title: 'Make a Network Introduction', points: 50 },
    { category: 'Projects', title: 'Complete a Survey', points: 50 },
  ],
};

describe('PlaaSnapshotSummaryModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentSnapshotStatus.mockReturnValue(STATUS);
  });

  it('renders nothing when closed', () => {
    const { container } = render(<PlaaSnapshotSummaryModal isOpen={false} onClose={mockOnClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the period and stat breakdown when open, with no PLAA figure', () => {
    render(<PlaaSnapshotSummaryModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('August 2026, in review')).toBeInTheDocument();
    expect(screen.getByText('activities')).toBeInTheDocument();
    expect(screen.getByText('categories')).toBeInTheDocument();
    expect(screen.getByText('points')).toBeInTheDocument();
    // An open snapshot never shows a PLAA figure — it's only issued at close.
    expect(screen.queryByText(/\d[\d,]*\s*PLAA/)).not.toBeInTheDocument();
  });

  it('lists each activity, ending in a running points total for the snapshot', () => {
    render(<PlaaSnapshotSummaryModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Activities this snapshot')).toBeInTheDocument();
    expect(screen.getByText('Make a Network Introduction')).toBeInTheDocument();
    expect(screen.getByText('Complete a Survey')).toBeInTheDocument();
    expect(screen.getAllByText('+50 points')).toHaveLength(2);

    expect(screen.getByText('So far this snapshot')).toBeInTheDocument();
    // "420 points" appears twice: once in the narrative summary, once in the
    // activities breakdown's closing total row.
    expect(screen.getAllByText('420 points')).toHaveLength(2);
  });

  it('shows the pending-until-close disclaimer', () => {
    render(<PlaaSnapshotSummaryModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Points are pending until the snapshot closes/)).toBeInTheDocument();
    expect(screen.getByText(/PLAA is issued at close/)).toBeInTheDocument();
  });

  it('calls onClose from the close button', () => {
    render(<PlaaSnapshotSummaryModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('the "See how to contribute more" CTA closes the modal and navigates to Activities', () => {
    render(<PlaaSnapshotSummaryModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /see how to contribute more/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/alignment-asset/activities');
  });
});
