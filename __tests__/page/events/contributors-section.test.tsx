/**
 * @fileoverview Unit tests for the ContributorsSection component.
 * Covers all branches, edge cases, and user interactions.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContributorsSection from '@/components/page/events/contributors/contributors-section';

// Mock MembersList
jest.mock('@/components/page/events/contributors/members-list', () => ({ __esModule: true, default: (props: any) => <div data-testid="members-list">{JSON.stringify(props)}</div> }));
// Mock Treemap and related recharts components
jest.mock('@/components/core/events/treemap', () => ({
  __esModule: true,
  Treemap: (props: any) => <div data-testid="treemap">{JSON.stringify(props.data)}</div>,
  ResponsiveContainer: (props: any) => <div data-testid="responsive-container">{props.children}</div>,
  Tooltip: (props: any) => <div data-testid="tooltip">Tooltip</div>,
  ChartTooltip: () => <div data-testid="chart-tooltip">ChartTooltip</div>,
  TreemapCustomContent: () => <div data-testid="treemap-custom-content">CustomContent</div>,
}));
// Mock ShadowButton
jest.mock('@/components/ui/ShadowButton', () => (props: any) => <button data-testid="shadow-btn" onClick={props.onClick}>{props.children}</button>);
// Mock Modal
jest.mock('@/components/core/modal', () => (props: any) => {
  // Attach showModal and close to the dialog ref
  const setRef = (node: any) => {
    if (node) {
      node.showModal = jest.fn();
      node.close = jest.fn();
      if (props.modalRef) props.modalRef.current = node;
    }
  };
  return (
    <dialog data-testid="modal" ref={setRef}>
      {props.children}
      <button data-testid="modal-close" onClick={props.onClose}>Close</button>
    </dialog>
  );
});
// Mock analytics
const onContributeButtonClicked = jest.fn();
const onContributtonModalCloseClicked = jest.fn();
const onContributeModalIRLProceedButtonClicked = jest.fn();
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({ onContributeButtonClicked, onContributtonModalCloseClicked, onContributeModalIRLProceedButtonClicked })
}));
// Mock constants
jest.mock('@/utils/constants', () => ({
  PAGE_ROUTES: { IRL: '/irl' },
  CONTRIBUTE_MODAL_VIDEO_URL: 'video.webm',
}));

describe('ContributorsSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseMembers = [{ name: 'Alice' }, { name: 'Bob' }];
  const baseTeams = [
    { name: 'Team A', hosts: 2, speakers: 1, logo: 'logoA.png', uid: 1 },
    { name: 'Team B', hosts: 1, speakers: 3, logo: 'logoB.png', uid: 2 },
  ];

  it('renders with default props', () => {
    render(<ContributorsSection />);
    expect(screen.getByTestId('members-list')).toBeInTheDocument();
    expect(screen.getByTestId('treemap')).toBeInTheDocument();
    expect(screen.getByText('Contributors')).toBeInTheDocument();
    expect(screen.getByText('Hosts & Speakers')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-btn')).toBeInTheDocument();
  });

  it('renders with provided members and teams', () => {
    render(<ContributorsSection members={baseMembers} teams={baseTeams} />);
    expect(screen.getByTestId('members-list')).toHaveTextContent('Alice');
    expect(screen.getByTestId('treemap')).toHaveTextContent('Team A');
    expect(screen.getByTestId('treemap')).toHaveTextContent('Team B');
  });

  it('renders with custom treemapConfig', () => {
    render(<ContributorsSection treemapConfig={{ backgroundColor: '#111', borderColor: '#222', height: 123 }} />);
    const treemapDiv = screen.getByTestId('responsive-container').parentElement;
    expect(treemapDiv).toHaveStyle('height: 123px');
    expect(treemapDiv).toHaveStyle('background-color: #111');
  });

  it('opens and closes the contribute modal', () => {
    render(<ContributorsSection />);
    // Open modal
    fireEvent.click(screen.getByTestId('shadow-btn'));
    expect(onContributeButtonClicked).toHaveBeenCalled();
    // Close modal
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onContributtonModalCloseClicked).toHaveBeenCalled();
  });

  it('calls analytics and opens IRL on proceed', () => {
    window.open = jest.fn();
    render(<ContributorsSection />);
    // Open modal
    fireEvent.click(screen.getByTestId('shadow-btn'));
    // Click proceed button
    fireEvent.click(screen.getByText('Continue to IRL Gatherings'));
    expect(onContributeModalIRLProceedButtonClicked).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith('/irl');
  });

  it('renders all modal content and video', () => {
    render(<ContributorsSection />);
    fireEvent.click(screen.getByTestId('shadow-btn'));
    expect(screen.getByText('Ways to contribute')).toBeInTheDocument();
    expect(screen.getByText('Plan or organize a gathering for the community.')).toBeInTheDocument();
    expect(screen.getByText('Share insights and expertise by speaking at an event.')).toBeInTheDocument();
    expect(screen.getByText('Be part of the experience and engage with others.')).toBeInTheDocument();
    expect(screen.getByText((content) =>
      content.includes('Once you land on IRL Gatherings')
    )).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Continue to IRL Gatherings')).toBeInTheDocument();
    expect(screen.getByText('Your browser does not support this video.')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  it('renders with empty members and teams', () => {
    render(<ContributorsSection members={[]} teams={[]} />);
    expect(screen.getByTestId('members-list')).toBeInTheDocument();
    expect(screen.getByTestId('treemap')).toBeInTheDocument();
  });

  it('renders with custom userInfo', () => {
    render(<ContributorsSection userInfo={{ id: 123, name: 'Test User' }} />);
    expect(screen.getByTestId('members-list')).toHaveTextContent('Test User');
  });
}); 