import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import IrlLocationCard from '@/components/page/irl/locations/irl-location-card';

describe('IrlLocationCard', () => {
  // Base props that will be used in most tests
  const mockProps = {
    isActive: false,
    onCardClick: jest.fn(),
    uid: 'test-123',
    location: 'San Francisco, USA',
    flag: '/flags/usa.svg',
    icon: '/icons/sf-icon.svg',
    pastEvents: [{}, {}, {}], // 3 past events
    upcomingEvents: [{}, {}], // 2 upcoming events
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders the component with all required elements', () => {
      render(<IrlLocationCard {...mockProps} />);
      
      // Check main container
      expect(screen.getByRole('img', { name: 'location' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'flag' })).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });

    it('renders the correct location name by trimming after comma', () => {
      render(<IrlLocationCard {...mockProps} />);
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      expect(screen.queryByText('USA')).not.toBeInTheDocument();
    });

    it('renders the correct number of past and upcoming events', () => {
      render(<IrlLocationCard {...mockProps} />);
      expect(screen.getByText('2')).toBeInTheDocument(); // Upcoming events
      expect(screen.getByText('3')).toBeInTheDocument(); // Past events
      expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
      expect(screen.getByText(/Past/)).toBeInTheDocument();
    });

    it('uses default image when icon is not provided', () => {
      render(<IrlLocationCard {...mockProps} icon={undefined} />);
      const img = screen.getByRole('img', { name: 'location' });
      expect(img).toHaveAttribute('src', '/images/irl/defaultImg.svg');
    });
  });

  describe('Active/Inactive State Tests', () => {
    it('applies active class when isActive is true', () => {
      render(<IrlLocationCard {...mockProps} isActive={true} />);
      const rootElement = screen.getByText('San Francisco').closest('.root');
      expect(rootElement).toHaveClass('root__active');
      expect(rootElement).not.toHaveClass('root__inactive');
    });

    it('applies inactive class when isActive is false', () => {
      render(<IrlLocationCard {...mockProps} isActive={false} />);
      const rootElement = screen.getByText('San Francisco').closest('.root');
      expect(rootElement).toHaveClass('root__inactive');
      expect(rootElement).not.toHaveClass('root__active');
    });
  });

  describe('Event Handling Tests', () => {
    it('calls onCardClick when clicked', () => {
      const onCardClick = jest.fn();
      render(<IrlLocationCard {...mockProps} onCardClick={onCardClick} />);
      const rootElement = screen.getByText('San Francisco').closest('.root');
      fireEvent.click(rootElement!);
      expect(onCardClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Conditional Rendering Tests', () => {
    it('does not show upcoming events section when there are no upcoming events', () => {
      render(<IrlLocationCard {...mockProps} upcomingEvents={[]} />);
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
    });

    it('does not show past events section when there are no past events', () => {
      render(<IrlLocationCard {...mockProps} pastEvents={[]} />);
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      const minimalProps = {
        isActive: false,
        onCardClick: jest.fn(),
        location: 'Test Location, TC',
      };
      render(<IrlLocationCard {...minimalProps} />);
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });
  });

  describe('Style and Layout Tests', () => {
    it('has all required CSS classes for styling', () => {
      render(<IrlLocationCard {...mockProps} />);
      expect(document.querySelector('.root')).toBeInTheDocument();
      expect(document.querySelector('.root__irlCard')).toBeInTheDocument();
      expect(document.querySelector('.root__irlLocation')).toBeInTheDocument();
      expect(document.querySelector('.root__location')).toBeInTheDocument();
      expect(document.querySelector('.root__event__cntr')).toBeInTheDocument();
    });

    it('renders flag image with correct dimensions', () => {
      render(<IrlLocationCard {...mockProps} />);
      const flagImg = screen.getByRole('img', { name: 'flag' });
      expect(flagImg).toHaveStyle({
        width: '20px',
        height: '20px',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles location without comma correctly', () => {
      render(<IrlLocationCard {...mockProps} location="Single Location" />);
      expect(screen.getByText('Single Location')).toBeInTheDocument();
    });

    it('handles empty events arrays', () => {
      render(
        <IrlLocationCard
          {...mockProps}
          pastEvents={[]}
          upcomingEvents={[]}
        />
      );
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });

    it('handles undefined events gracefully', () => {
      render(
        <IrlLocationCard
          {...mockProps}
          pastEvents={undefined}
          upcomingEvents={undefined}
        />
      );
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });
  });
});
