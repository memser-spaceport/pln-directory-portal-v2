import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

// Mock next/navigation useRouter
const refreshMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock })
}));

// Mock PAGE_ROUTES
jest.mock('@/utils/constants', () => ({
  PAGE_ROUTES: {
    TEAMS: '/teams',
    MEMBERS: '/members',
    PROJECTS: '/projects',
    EVENTS: '/events',
    HOME: '/home',
  }
}));

import Error from '@/components/core/error';

// Test suite for Error component

describe('Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Calls router.refresh on mount
  it('calls router.refresh on mount', () => {
    render(<Error />);
    expect(refreshMock).toHaveBeenCalled();
  });

  // Test: Renders error illustration, title, description, and navigation links
  it('renders error illustration, title, description, and navigation links', () => {
    render(<Error />);
    // Illustration
    const img = screen.getByAltText('error');
    expect(img).toHaveAttribute('src', '/icons/notfound.svg');
    // Title
    expect(screen.getByRole('heading', { name: /oh snap! something went wrong!/i })).toBeInTheDocument();
    // Description
    expect(screen.getByText(/the page you're looking for doesn't exists or has been removed/i)).toBeInTheDocument();
    // Navigation links
    expect(screen.getByRole('link', { name: /teams/i })).toHaveAttribute('href', '/teams');
    expect(screen.getByRole('link', { name: /members/i })).toHaveAttribute('href', '/members');
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /events/i })).toHaveAttribute('href', '/events');
    // Back to Home button
    const homeLink = screen.getByRole('link', { name: /back to home/i });
    expect(homeLink).toHaveAttribute('href', '/home');
    expect(homeLink).toHaveClass('error-container__content__message__back-to-home');
  });

  // Test: Has correct structure and classes
  it('has correct structure and classes', () => {
    const { container } = render(<Error />);
    // Outer container
    const outer = container.querySelector('.error-container');
    expect(outer).toBeInTheDocument();
    // Content container
    const content = container.querySelector('.error-container__content');
    expect(content).toBeInTheDocument();
    // Not found image container
    const notfound = container.querySelector('.error-container__content__notfoundcontainer');
    expect(notfound).toBeInTheDocument();
    // Message container
    const message = container.querySelector('.error-container__content__message');
    expect(message).toBeInTheDocument();
  });

  // Test: Accessibility - heading and all links are present
  it('is accessible with heading and all links', () => {
    render(<Error />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /members/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
  });
}); 