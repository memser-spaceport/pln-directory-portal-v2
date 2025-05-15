import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { HOME_PAGE_LINKS } from '@/utils/constants';
import FeaturedHeader from '@/components/page/home/featured/featured-header';

// Mocking dependencies
jest.mock('@/analytics/home.analytics');
jest.mock('@/utils/common.utils');

describe('FeaturedHeader Component', () => {
  const mockUserInfo = { id: 'user1' };
  const mockAnalytics = {
    featuredSubmitRequestClicked: jest.fn(),
    onFeaturedFilterClicked: jest.fn(),
  };

  beforeEach(() => {
    (useHomeAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    (getAnalyticsUserInfo as jest.Mock).mockReturnValue(mockUserInfo);
  });

  it('renders the FeaturedHeader component', () => {
    render(<FeaturedHeader 
      userInfo={mockUserInfo}
      onClick={() => {}}
      activeFilter=""
    />);
    // Check for the "All" filter button instead of "Featured"
    expect(screen.getByText('All')).toBeInTheDocument();
    // Check for other filter options to verify the component rendered correctly
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
  });

  it('renders the "Submit a request" link with correct URL', () => {
    render(<FeaturedHeader 
      userInfo={mockUserInfo} 
      onClick={() => {}}
      activeFilter=""
    />); 
    const link = screen.getByText('Submit a request');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', HOME_PAGE_LINKS.FEATURED_REQUEST_URL);
  });

  it('calls featuredSubmitRequestClicked when "Submit a request" link is clicked', () => {
    render(<FeaturedHeader 
      userInfo={mockUserInfo}
      onClick={() => {}}
      activeFilter=""
    />);
    const link = screen.getByText('Submit a request');
    fireEvent.click(link);
    expect(mockAnalytics.featuredSubmitRequestClicked).toHaveBeenCalledWith(mockUserInfo, HOME_PAGE_LINKS.FEATURED_REQUEST_URL);
  });

  it('calls onClick and analytics when a filter button is clicked', () => {
    const mockOnClick = jest.fn();
    render(<FeaturedHeader 
      userInfo={mockUserInfo}
      onClick={mockOnClick}
      activeFilter=""
    />);
    
    const teamFilterButton = screen.getByText('Team');
    fireEvent.click(teamFilterButton);
    
    expect(mockOnClick).toHaveBeenCalledWith('team');
    expect(mockAnalytics.onFeaturedFilterClicked).toHaveBeenCalledWith('team');
  });

  it('applies active class to the selected filter', () => {
    render(<FeaturedHeader 
      userInfo={mockUserInfo}
      onClick={() => {}}
      activeFilter="team"
    />);
    
    const teamFilterButton = screen.getByText('Team');
    expect(teamFilterButton.className).toContain('active');
  });
});