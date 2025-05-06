import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventsBanner from '@/components/page/events/events-banner';

// Mock ShadowButton to simplify rendering and test text
jest.mock('@/components/ui/ShadowButton', () => (props: any) => (
  <button data-testid={props.children === 'View Gatherings' ? 'gatherings-btn' : 'events-btn'} {...props}>
    {props.children}
    {props.iconSrc && <img src={props.iconSrc} alt={props.iconAlt} width={props.iconWidth} height={props.iconHeight} />}
  </button>
));

// Mock analytics
const onViewAllGatheringsClicked = jest.fn();
const onViewAllEventsClicked = jest.fn();
jest.mock('@/analytics/events.analytics', () => ({
  useEventsAnalytics: () => ({
    onViewAllGatheringsClicked,
    onViewAllEventsClicked,
  })
}));

// Mock constants
jest.mock('@/utils/constants', () => ({
  PAGE_ROUTES: { IRL: '/irl' }
}));

// Save/restore env
const OLD_ENV = { ...process.env };
beforeEach(() => {
  jest.clearAllMocks();
  process.env.PL_EVENTS_BASE_URL = 'https://events.example.com';
});
afterAll(() => {
  process.env = OLD_ENV;
});

describe('EventsBanner', () => {
  it('renders banner image, title, description, and both buttons', () => {
    render(<EventsBanner />);
    expect(screen.getByAltText('Events Banner')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Protocol Labs Events')).toBeInTheDocument();
    expect(screen.getByText('Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem')).toBeInTheDocument();
    expect(screen.getByTestId('gatherings-link')).toBeInTheDocument();
    expect(screen.getByTestId('events-link')).toBeInTheDocument();
    expect(screen.getByTestId('gatherings-btn')).toHaveTextContent('View Gatherings');
    expect(screen.getByTestId('events-btn')).toHaveTextContent('View all Events');
  });

  it('gatherings button has correct href and calls analytics on click', () => {
    render(<EventsBanner />);
    const link = screen.getByTestId('gatherings-link');
    expect(link).toHaveAttribute('href', '/irl');
    fireEvent.click(link);
    expect(onViewAllGatheringsClicked).toHaveBeenCalled();
  });

  it('events button has correct href, target, and calls analytics on click', () => {
    render(<EventsBanner />);
    const link = screen.getByTestId('events-link');
    expect(link).toHaveAttribute('href', 'https://events.example.com/program');
    expect(link).toHaveAttribute('target', '_blank');
    fireEvent.click(link);
    expect(onViewAllEventsClicked).toHaveBeenCalled();
  });

  it('events button renders icon with correct src, alt, width, and height', () => {
    render(<EventsBanner />);
    const btn = screen.getByTestId('events-btn');
    const icon = btn.querySelector('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/icons/black-link-up-arrow.svg');
    expect(icon).toHaveAttribute('alt', 'Open link');
    expect(icon).toHaveAttribute('width', '16');
    expect(icon).toHaveAttribute('height', '16');
  });

  it('renders with no props and does not crash', () => {
    expect(() => render(<EventsBanner />)).not.toThrow();
  });

  it('uses default env if PL_EVENTS_BASE_URL is missing', () => {
    delete process.env.PL_EVENTS_BASE_URL;
    render(<EventsBanner />);
    const link = screen.getByTestId('events-link');
    // Should fallback to undefined/program
    expect(link).toHaveAttribute('href', 'undefined/program');
  });
});


