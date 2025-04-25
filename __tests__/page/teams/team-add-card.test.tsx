import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamAddCard from '@/components/page/teams/team-add-card';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { useRouter } from 'next/navigation';

// Mock the modules
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('TeamAddCard', () => {
  const mockPush = jest.fn();
  const mockOnSubmitATeamBtnClicked = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useCommonAnalytics as jest.Mock).mockReturnValue({
      onSubmitATeamBtnClicked: mockOnSubmitATeamBtnClicked,
    });
  });

  it('renders correctly with default view type', () => {
    render(<TeamAddCard />);
    
    // Check if the component rendered correctly
    expect(screen.getByAltText('add')).toBeInTheDocument();
    expect(screen.getByText('Add Team')).toBeInTheDocument();
    expect(screen.getByText('List your team here')).toBeInTheDocument();
    
    // Check if the default view is not list view
    const linkElement = screen.getByRole('link');
    expect(linkElement).not.toHaveClass('team-card--list');
  });

  it('renders correctly with list view type', () => {
    render(<TeamAddCard viewType={VIEW_TYPE_OPTIONS.LIST} />);
    
    // Check if the component rendered correctly
    expect(screen.getByAltText('add')).toBeInTheDocument();
    expect(screen.getByText('Add Team')).toBeInTheDocument();
    expect(screen.getByText('List your team here')).toBeInTheDocument();
    
    // Check if the list view is applied
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveClass('team-card--list');
    
    // Check if the container div has the list view class
    const containerDiv = linkElement.parentElement;
    expect(containerDiv).toHaveClass('team-card--div');
  });

  it('calls analytics and navigates when clicking the link', () => {
    render(<TeamAddCard />);
    
    // Click the link
    const linkElement = screen.getByRole('link');
    fireEvent.click(linkElement);
    
    // Check if analytics was called
    expect(mockOnSubmitATeamBtnClicked).toHaveBeenCalledTimes(1);
    
    // Check if router.push was called with the correct route
    expect(mockPush).toHaveBeenCalledWith(PAGE_ROUTES.ADD_TEAM);
  });

  it('passes userInfo prop correctly', () => {
    const mockUserInfo = { id: '123', name: 'Test User' };
    render(<TeamAddCard userInfo={mockUserInfo} />);
    
    // The userInfo prop is passed but not directly rendered in the component
    // We can verify the component renders correctly
    expect(screen.getByText('Add Team')).toBeInTheDocument();
  });

  it('applies responsive styles correctly', () => {
    render(<TeamAddCard />);
    
    // Check if the style element is present
    const styleElement = document.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    
    // Check if the style contains responsive media query
    const styleContent = styleElement?.textContent || '';
    expect(styleContent).toContain('@media(min-width:1024px)');
  });
});
