// unit test for irl error page

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
  PAGE_ROUTES: { IRL: '/irl-gatherings' }
}));

import IrlErrorPage from '@/components/core/irl-error-page';

// Test suite for IrlErrorPage component

describe('IrlErrorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Calls router.refresh on mount
  it('calls router.refresh on mount', () => {
    render(<IrlErrorPage />);
    expect(refreshMock).toHaveBeenCalled();
  });

  // Test: Renders error illustration, title, description, and button
  it('renders error illustration, title, description, and button', () => {
    render(<IrlErrorPage />);
    // Illustration
    const img = screen.getByAltText('error');
    expect(img).toHaveAttribute('src', '/icons/irl-not-found.svg');
    // Title
    expect(screen.getByRole('heading', { name: /oops, you've wandered off the map/i })).toBeInTheDocument();
    // Description
    expect(screen.getByText(/looks like you're trying to explore a location not in our listings/i)).toBeInTheDocument();
    // Button (link)
    const link = screen.getByRole('link', { name: /back to irl gatherings/i });
    expect(link).toHaveAttribute('href', '/irl-gatherings');
    expect(link).toHaveClass('error-container__content__message__back-to-home');
  });

  // Test: Has correct structure and classes
  it('has correct structure and classes', () => {
    const { container } = render(<IrlErrorPage />);
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

  // Test: Accessibility - heading and link are present
  it('is accessible with heading and link', () => {
    render(<IrlErrorPage />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to irl gatherings/i })).toBeInTheDocument();
  });
});

