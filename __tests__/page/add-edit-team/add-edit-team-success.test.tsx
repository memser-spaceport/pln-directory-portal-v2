import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddEditTeamSuccess from '@/components/page/add-edit-team/add-edit-team-success';
import { useRouter } from 'next/navigation';
import { useJoinNetworkAnalytics } from '@/analytics/join-network.analytics';
import { PAGE_ROUTES } from '@/utils/constants';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the analytics hook
jest.mock('@/analytics/join-network.analytics', () => ({
  useJoinNetworkAnalytics: jest.fn()
}));

describe('AddEditTeamSuccess Component', () => {
  // Set up mocks for router and analytics
  const pushMock = jest.fn();
  const recordTeamSubmitSuccessHomeClickMock = jest.fn();
  const recordTeamSubmitSuccessAnotherTeamClickMock = jest.fn();
  
  // Mock window.location.href
  let locationHref: string;
  
  beforeAll(() => {
    // Store original location.href
    locationHref = window.location.href;
    
    // Setup a getter/setter for href that we can spy on
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        get href() {
          return locationHref;
        },
        set href(value) {
          locationHref = value;
        }
      },
      writable: false,
      configurable: true
    });
  });
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset href for each test
    locationHref = 'http://localhost';
    
    // Set up router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock
    });
    
    // Set up analytics mock
    (useJoinNetworkAnalytics as jest.Mock).mockReturnValue({
      recordTeamSubmitSuccessHomeClick: recordTeamSubmitSuccessHomeClickMock,
      recordTeamSubmitSuccessAnotherTeamClick: recordTeamSubmitSuccessAnotherTeamClickMock
    });
  });

  it('renders the component with all expected elements', () => {
    render(<AddEditTeamSuccess />);
    
    // Check that all elements are rendered
    const image = screen.getByAltText('under-review');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('/images/team/under-review.svg');
    
    // Check text content
    expect(screen.getByText('Team Under Review')).toBeInTheDocument();
    expect(screen.getByText('Our team will review your request and get back to you shortly')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Submit another Team')).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('navigates to home and records analytics when Back to Home button is clicked', () => {
    render(<AddEditTeamSuccess />);
    
    // Click the Back to Home button
    fireEvent.click(screen.getByText('Back to Home'));
    
    // Check if router.push was called with correct path
    expect(pushMock).toHaveBeenCalledWith('/');
    
    // Check if analytics was recorded
    expect(recordTeamSubmitSuccessHomeClickMock).toHaveBeenCalled();
  });

  it('navigates to add team page and records analytics when Submit another Team button is clicked', () => {
    render(<AddEditTeamSuccess />);
    
    // Click the Submit another Team button
    fireEvent.click(screen.getByText('Submit another Team'));
    
    // Check if window.location.href was set correctly
    expect(locationHref).toBe(PAGE_ROUTES.ADD_TEAM);
    
    // Check if analytics was recorded
    expect(recordTeamSubmitSuccessAnotherTeamClickMock).toHaveBeenCalled();
  });

  it('applies CSS classes for responsive design', () => {
    const { container } = render(<AddEditTeamSuccess />);
    
    // Check main container class
    const mainContainer = container.querySelector('.team-submit-success__cn');
    expect(mainContainer).toBeInTheDocument();
    
    // Check info container
    const infoContainer = container.querySelector('.team-submit-success__cn__info');
    expect(infoContainer).toBeInTheDocument();
    
    // Check title and text
    const title = container.querySelector('.team-submit-success__cn__info__title');
    expect(title).toBeInTheDocument();
    const text = container.querySelector('.team-submit-success__cn__info__text');
    expect(text).toBeInTheDocument();
    
    // Check action buttons
    const actionContainer = container.querySelector('.team-submit-success__cn__info__action');
    expect(actionContainer).toBeInTheDocument();
    const submitButton = container.querySelector('.team-submit-success__cn__info__action__submit');
    expect(submitButton).toBeInTheDocument();
    const backButton = container.querySelector('.team-submit-success__cn__info__action__back');
    expect(backButton).toBeInTheDocument();
  });
}); 