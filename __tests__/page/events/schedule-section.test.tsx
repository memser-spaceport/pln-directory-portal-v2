/**
 * @fileoverview Unit tests for the ScheduleSection component.
 * Covers all branches, edge cases, and user interactions.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScheduleSection from '@/components/page/events/schedule-section';

// --- Mocks ---
// Mock ShadowButton for button rendering
jest.mock('@/components/ui/ShadowButton', () => (props: any) => <button data-testid={props.children} onClick={props.onClick}>{props.children}</button>);
// Mock analytics hooks for button tracking
const onSubmitEventButtonClicked = jest.fn();
const onGoToEventsButtonClicked = jest.fn();
const onSubscribeForUpdatesButtonClicked = jest.fn();
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({ onSubmitEventButtonClicked, onGoToEventsButtonClicked, onSubscribeForUpdatesButtonClicked })
}));
// Mock getAnalyticsUserInfo
jest.mock('@/utils/common.utils', () => ({ getAnalyticsUserInfo: (u: any) => u }));

describe('ScheduleSection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Render tests ---
  it('renders the schedule section and iframe', () => {
    render(<ScheduleSection />);
    expect(screen.getByText('Event Calendar')).toBeInTheDocument();
    expect(screen.getByTestId('Submit an Event')).toBeInTheDocument();
    expect(screen.getByTestId('View all Events')).toBeInTheDocument();
    expect(screen.getByTitle('Event Calendar')).toBeInTheDocument();
  });

  // --- Button click analytics ---
  it('calls analytics on Submit an Event click', () => {
    render(<ScheduleSection />);
    fireEvent.click(screen.getByTestId('Submit an Event').closest('a')!);
    expect(onSubmitEventButtonClicked).toHaveBeenCalled();
  });

  it('calls analytics on View all Events click', () => {
    render(<ScheduleSection />);
    fireEvent.click(screen.getByTestId('View all Events').closest('a')!);
    expect(onGoToEventsButtonClicked).toHaveBeenCalled();
  });

  // --- Edge case: with userInfo (for future subscribe button) ---
  it('renders with userInfo prop (for coverage)', () => {
    render(<ScheduleSection userInfo={{ id: 1, name: 'Test User' }} />);
    expect(screen.getByText('Event Calendar')).toBeInTheDocument();
  });

  // --- Edge case: environment variables missing ---
  it('renders with missing env vars', () => {
    const oldEnv = { ...process.env };
    delete process.env.PL_EVENTS_SUBMISSION_URL;
    delete process.env.PL_EVENTS_BASE_URL;
    render(<ScheduleSection />);
    expect(screen.getByText('Event Calendar')).toBeInTheDocument();
    process.env = oldEnv;
  });
}); 