import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import IrlLocationPopupView from '@/components/page/irl/locations/irl-location-popupView';
import type { IUpcomingEvents, IPastEvents } from '@/types/irl.types';

describe('IrlLocationPopupView', () => {
  // Mock location data
  const mockLocation = {
    flag: '/flags/usa.svg',
    location: 'San Francisco, USA',
    upcomingEvents: [
      { slugURL: 'upcoming1' },
      { slugURL: 'upcoming2' }
    ] as IUpcomingEvents[],
    pastEvents: [
      { slugURL: 'past1' },
      { slugURL: 'past2' },
      { slugURL: 'past3' }
    ] as IPastEvents[]
  };

  // Mock click handler
  const handleResourceClick = jest.fn();

  // Base props that will be used in most tests
  const mockProps = {
    location: mockLocation,
    handleResourceClick
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders the component with all required elements', () => {
      render(<IrlLocationPopupView {...mockProps} />);
      
      // Check location name (trimmed before comma)
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      
      // Check flag image
      const flagImg = screen.getByRole('img', { name: 'flag' });
      expect(flagImg).toBeInTheDocument();
      expect(flagImg).toHaveAttribute('src', '/flags/usa.svg');
      expect(flagImg).toHaveStyle({
        width: '20px',
        height: '20px'
      });
    });

    it('renders correct event counts', () => {
      render(<IrlLocationPopupView {...mockProps} />);
      
      // Check upcoming events count
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
      
      // Check past events count
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/Past/)).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('calls handleResourceClick when clicked', () => {
      render(<IrlLocationPopupView {...mockProps} />);
      
      const container = screen.getByText('San Francisco').closest('.root__irl__overlay__cnt');
      fireEvent.click(container!);
      
      expect(handleResourceClick).toHaveBeenCalledTimes(1);
      expect(handleResourceClick).toHaveBeenCalledWith(mockLocation);
    });
  });

  describe('Style and Layout Tests', () => {
    it('has all required CSS classes for styling', () => {
      render(<IrlLocationPopupView {...mockProps} />);
      
      expect(document.querySelector('.root__irl__overlay__cnt')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__overlay__cnt__location')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__overlay__cnt__location__icon')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__overlay__cnt__location__title')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__overlay__cnt__events')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles location without events', () => {
      const propsWithoutEvents = {
        location: {
          flag: '/flags/usa.svg',
          location: 'San Francisco, USA'
        },
        handleResourceClick
      };
      
      render(<IrlLocationPopupView {...propsWithoutEvents} />);
      
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });

    it('handles empty events arrays', () => {
      const propsWithEmptyEvents = {
        location: {
          ...mockLocation,
          upcomingEvents: [],
          pastEvents: []
        },
        handleResourceClick
      };
      
      render(<IrlLocationPopupView {...propsWithEmptyEvents} />);
      
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });

    it('handles location without comma', () => {
      const propsWithoutComma = {
        location: {
          ...mockLocation,
          location: 'San Francisco'
        },
        handleResourceClick
      };
      
      render(<IrlLocationPopupView {...propsWithoutComma} />);
      
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
    });

    it('handles undefined events gracefully', () => {
      const propsWithUndefinedEvents = {
        location: {
          flag: '/flags/usa.svg',
          location: 'San Francisco, USA',
          upcomingEvents: undefined,
          pastEvents: undefined
        },
        handleResourceClick
      };
      
      render(<IrlLocationPopupView {...propsWithUndefinedEvents} />);
      
      expect(screen.queryByText(/Upcoming/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Past/)).not.toBeInTheDocument();
    });
  });
});
