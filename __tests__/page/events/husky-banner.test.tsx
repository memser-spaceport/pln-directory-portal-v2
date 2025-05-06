/**
 * @fileoverview Unit tests for the HuskyBanner component.
 * Covers all branches, edge cases, and user interactions.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HuskyBanner from '@/components/page/events/husky-banner';

// --- Mocks ---
// Mock ShadowButton for button rendering
jest.mock('@/components/ui/ShadowButton', () => (props: any) => <button data-testid="ask-husky-btn" onClick={props.onClick}>{props.children}</button>);
// Mock analytics hooks for button tracking
const onAskHuskyButtonClicked = jest.fn();
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({ onAskHuskyButtonClicked })
}));
// Mock constants
jest.mock('@/utils/constants', () => ({
  PAGE_ROUTES: { HUSKY: '/husky' },
}));

describe('HuskyBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- Render tests ---
  it('renders the banner, images, title, and button', () => {
    render(<HuskyBanner />);
    expect(screen.getByText('Have questions about events or contributors?')).toBeInTheDocument();
    expect(screen.getByAltText('Husky Banner Web')).toBeInTheDocument();
    expect(screen.getByAltText('Husky Banner Mobile')).toBeInTheDocument();
    expect(screen.getByTestId('ask-husky-btn')).toBeInTheDocument();
    expect(screen.getByText('Ask Husky')).toBeInTheDocument();
  });

  // --- Button click analytics ---
  it('calls analytics on Ask Husky button click', () => {
    render(<HuskyBanner />);
    fireEvent.click(screen.getByTestId('ask-husky-btn'));
    expect(onAskHuskyButtonClicked).toHaveBeenCalled();
  });

  // --- Link and href ---
  it('renders the Ask Husky link with correct href', () => {
    render(<HuskyBanner />);
    const link = screen.getByRole('link', { name: /ask husky/i });
    expect(link).toHaveAttribute('href', '/husky');
    expect(link).toHaveAttribute('target', '_blank');
  });

  // --- Edge case: renders with no props ---
  it('renders with no props (default)', () => {
    render(<HuskyBanner />);
    expect(screen.getByText('Have questions about events or contributors?')).toBeInTheDocument();
  });
}); 