import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import IrlSeeMoreLocationCard from '@/components/page/irl/locations/irl-see-more-location-card';
import type { ILocationDetails, IUpcomingEvents, IPastEvents, AdditionalResource } from '@/types/irl.types';

describe('IrlSeeMoreLocationCard', () => {
  // Mock ref creation
  const mockRef = { current: document.createElement('div') };
  
  // Helper: create fake locations (same as irl-location.test.tsx)
  const makeFullLocations = (n: number): ILocationDetails[] =>
    Array.from({ length: n }, (_, i) => ({
      uid: `uid${i}`,
      location: `Location${i}, Country`,
      flag: `/flag${i}.svg`,
      icon: `/icon${i}.svg`,
      priority: i,
      name: `Location Name ${i}`,
      description: `Description for location ${i}`,
      startDate: `2024-01-0${i + 1}`,
      endDate: `2024-01-1${i + 1}`,
      events: [],
      allEvents: [],
      upcomingEvents: i % 2 === 1 ? [{ slugURL: `upcoming${i}` }] as IUpcomingEvents[] : [],
      pastEvents: i % 2 === 0 ? [{ slugURL: `past${i}` }] as IPastEvents[] : [],
      resources: [] as AdditionalResource[],
    }));

  // Base props that will be used in most tests
  const mockProps = {
    locationRef: mockRef,
    handleClick: jest.fn(),
    locations: makeFullLocations(5),
    count: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders the component with all required elements', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      // Check main text
      expect(screen.getByText('See Other Locations')).toBeInTheDocument();
      
      // Check down arrow icon
      expect(screen.getByRole('img', { name: 'downArrow' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'downArrow' })).toHaveAttribute('src', '/images/irl/upsideCap.svg');
    });

    it('renders correct number of location flags based on count and slice', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} count={1} />);
      
      // Should show 3 flags (count + 3)
      const flagImages = screen.getAllByRole('img', { name: 'flag' });
      expect(flagImages).toHaveLength(3);
      
      // Check flag attributes
      flagImages.forEach(flag => {
        expect(flag).toHaveStyle({
          width: '20px',
          height: '20px'
        });
      });
    });

    it('handles edge case when locations array is smaller than slice range', () => {
      const props = {
        ...mockProps,
        count: 3,
        locations: makeFullLocations(4) // Only 4 locations
      };
      
      render(<IrlSeeMoreLocationCard {...props} />);
      const flagImages = screen.getAllByRole('img', { name: 'flag' });
      expect(flagImages).toHaveLength(1); // Should only show 1 remaining flag
    });
  });

  describe('Interaction Tests', () => {
    it('calls handleClick when card is clicked', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      const card = screen.getByText('See Other Locations').closest('.root__irl__expanded');
      fireEvent.click(card!);
      
      expect(mockProps.handleClick).toHaveBeenCalledTimes(1);
    });

    it('passes the event object to handleClick', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      const card = screen.getByText('See Other Locations').closest('.root__irl__expanded');
      fireEvent.click(card!);
      
      expect(mockProps.handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Style and Layout Tests', () => {
    it('has all required CSS classes for styling', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      expect(document.querySelector('.root__irl__expanded')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__expanded__showMore')).toBeInTheDocument();
      expect(document.querySelector('.root_irl__expanded__imgcntr')).toBeInTheDocument();
      expect(document.querySelector('.root__irl__expanded__icon')).toBeInTheDocument();
    });

    it('applies correct styling to flag container images', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      const flagContainers = document.querySelectorAll('.root_irl__expanded__imgcntr__img');
      flagContainers.forEach(container => {
        expect(container).toHaveClass('root_irl__expanded__imgcntr__img');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty locations array', () => {
      render(
        <IrlSeeMoreLocationCard
          {...mockProps}
          locations={[]}
        />
      );
      
      expect(screen.queryByRole('img', { name: 'flag' })).not.toBeInTheDocument();
      expect(screen.getByText('See Other Locations')).toBeInTheDocument();
    });

    it('handles undefined locations gracefully', () => {
      render(
        <IrlSeeMoreLocationCard
          {...mockProps}
          locations={undefined as any}
        />
      );
      
      expect(screen.queryByRole('img', { name: 'flag' })).not.toBeInTheDocument();
      expect(screen.getByText('See Other Locations')).toBeInTheDocument();
    });
  });

  describe('Ref Tests', () => {
    it('correctly assigns the ref to the root element', () => {
      render(<IrlSeeMoreLocationCard {...mockProps} />);
      
      const rootElement = screen.getByText('See Other Locations').closest('.root__irl__expanded');
      expect(rootElement).toBeTruthy();
    });
  });
});